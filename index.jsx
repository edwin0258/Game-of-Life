import React from 'react';
import ReactDOM from 'react-dom'
let tinycolor = require('tinycolor2')
class Cell extends React.Component {
  componentWillReceiveProps(nextProps) {
    if(this.props.alive != nextProps.alive) {
      let newColor = nextProps.alive == true ? this.props.color : 'white'
      this.setState({currentColor: newColor})
    }
    if(this.props.color != nextProps.color) {
      this.setState({currentColor: this.getColor(nextProps.color)})
    }
    if(this.props.gridlines != nextProps.gridlines) {
      this.setState({gridlines: this.getGridlines(nextProps.gridlines)})
    }
  }

  getColor(color) {
    return this.props.alive == true ? color : 'white'
  }

  getGridlines(gridlines) {
    return gridlines == true ? 'inset 0px 0px 0px 1px rgba(0,0,0,.2)' : 'none'
  }

  toggleCellState() {
    this.props.onClick(this.props.id)
  }

  getRandomColor() {
    let currentColor = this.getColor(this.props.color)
    if(this.props.alive == true && this.props.isStarted == true) {
      let rand_num = Math.floor(Math.random() * (3 - 0))
      switch(rand_num){
        case(0):
          currentColor = tinycolor(currentColor).lighten(5)
          break
        case(1):
          currentColor = tinycolor(currentColor).darken(5)
          break
       }
    }
    return currentColor
  }

  render() {
    return (
      <div className="cell" onClick={this.toggleCellState.bind(this)}
        style={{background: this.getRandomColor(),
        boxShadow: this.getGridlines(this.props.gridlines)}}></div>
    )
  }
}

class Controls extends React.Component {
  componentWillReceiveProps(nextProps) {
    if(this.props.color != nextProps.color) {
      this.colorStyle.background = nextProps.color
      this.colorStyle.borderColor = tinycolor(nextProps.color).lighten()
      this.colorStyle.color = tinycolor(nextProps.color).isLight() ? 'black' : 'white'
    }
  }

  getStartStopButton() {
    if(this.props.isStarted == false) {
     return <button className="start_btn btn" onClick={this.props.onStart}
      style={this.colorStyle}>Start</button>
    } else {
     return <button className="start_btn btn" onClick={this.props.onStop}
      style={this.colorStyle}>Stop</button>
    }
  }

  getSpeedName() {
   let speeds = {100: 'Slow', 50: 'Medium', 10: 'Fast'}
   return speeds[this.props.speed]
  }

  render() {
    let start_stop_btn = this.getStartStopButton()
    let speed_name = this.getSpeedName()

    return (
      <div className="controls" >
        <div className="main_options">
          <button className="nextGen_btn btn" onClick={this.props.onNext}
            style={this.colorStyle}>Next</button>

          {start_stop_btn}

          <button className="start_btn btn" onClick={this.props.onSpeed}
            style={this.colorStyle}>{speed_name}</button>

          <div className="stats">
            <p className="stat">
              Generation:<span className="stat_dynamic">&nbsp;{this.props.generation}</span>
            </p>

            <p className="stat">
              Population:<span className="stat_dynamic">&nbsp;{this.props.population}</span>
            </p>
          </div>
        </div>

        <div className="more_options">
          <div className="color_container">
            <small className="color_tip">Color</small>
            <input type="color" className="color_input" onChange={this.props.onChange}
              defaultValue={this.props.color}/>
          </div>

          <button className="toggle_grid btn" style={this.colorStyle}
            onClick={this.props.toggleGrid}>Toggle Grid</button>

          <button className="random_btn btn" style={this.colorStyle}
            onClick={this.props.onRandom}>Random</button>

          <button className="clear_grid btn" style={this.colorStyle}
            onClick={this.props.onClear}>Clear</button>
        </div>
      </div>
    )
  }

  colorStyle = {
    background: this.props.color,
    borderColor: tinycolor(this.props.color).lighten(),
    color: tinycolor(this.props.color).isLight() ? 'black' : 'white'
  };
}

class App extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      cell_states: this.randomGrid(),
      color: '#f21a38',
      generation_count: 0,
      gridlines: true,
      population: '-',
      started: false,
      speed: 100
    }
  }

  componentWillMount() {
    this.setBackgroundColor()
    this.setState({population: this.getPopulation()})
  }

  componentDidUpdate(prevProps,prevState) {
    if(this.state.speed != prevState.speed) {
      this.autoGeneration.stopGenerate()
      this.autoGeneration.startGenerate()
    }
    if(this.state.color != prevState.color) {
      this.setBackgroundColor()
    }
    //For updating the population when an individual cell is toggled.
    if(this.state.started == false && this.state.cell_states != prevState.cell_states) {
      this.setState({population: this.getPopulation()})
    }
  }

  changeColor(e) {
    this.setState({color: e.target.value})
  }

  getPopulation() {
    let population_count = this.state.cell_states.reduce((count, cell_state) => {
      if(cell_state == true)
        count++
      return count
    },0)
    return population_count
  }

  generateCells() {
    return this.state.cell_states.map((cell,i) => (
      <Cell key={i} id={i}
        onClick={this.handleCellToggle.bind(this)}
        alive={cell}
        color={this.state.color}
        gridlines={this.state.gridlines}
        isStarted={this.state.started}/>
    ))
  }

  handleSpeed() {
    let speeds = [100, 50, 10]
    let nextSpeed = (speeds[speeds.indexOf(this.state.speed) + 1] || speeds[0])
    this.setState({speed: nextSpeed})
  }

  handleRandom() {
    this.setState({cell_states: this.randomGrid(),
                   generation_count: 0,
                   population: 0})
  }

  handleClear() {
    let temp_states = [...this.state.cell_states].map((state) => false)
    this.autoGeneration.stopGenerate()
    this.setState({cell_states: temp_states,
                   generation_count: 0,
                   population: 0})
  }

  handleCellToggle(i) {
    let temp_states = [...this.state.cell_states]
    temp_states[i] = !temp_states[i]

    this.setState({cell_states: temp_states})
  }

  nextGeneration(){
    let temp_states = [...this.state.cell_states]
    let final_temp_states = temp_states.map((state,i) => {
      /*For retrieving the correct neighbours
      depending on board size*/
      let x = Math.sqrt(this.props.cell_count)

      let neighbours = [
        temp_states[i+(x-1)],
        temp_states[i+x],
        temp_states[i+(x+1)],
        temp_states[i+1],
        temp_states[i-1],
        temp_states[i-(x-1)],
        temp_states[i-x],
        temp_states[i-(x+1)]
      ]

      //Get number of alive neighbours
      neighbours = neighbours.reduce((count, neighbour) => {
        return count += neighbour == true ? 1 : 0
      },0)

      if(neighbours < 2 || neighbours > 3){
        return false //Cell dies due to overcrowding or starvation
      } else if((neighbours == 2 || neighbours == 3) && state == true) {
        return true //Cell lives another cycle
      } else if(neighbours == 3) {
        return true //Cell is born
      }
    })

    let temp_count = this.state.generation_count
    temp_count++
    this.setState({
      cell_states: final_temp_states,
      generation_count: temp_count,
      population: this.getPopulation()
    })
  }

  randomGrid() {
    let temp_array = []
    for(let i = 0; i < this.props.cell_count; i++) {
      let random_state = Math.floor(Math.random() * (3 - 0))
      temp_array.push(random_state == 1 ? true : false)
    }
    return temp_array
  }

  setBackgroundColor() {
    document.querySelector('body').style.background =
      tinycolor(this.state.color).isDark() ?
      tinycolor(this.state.color).brighten() :
      tinycolor(this.state.color).darken(10)
  }

  toggleGridlines() {
    this.setState({gridlines: !this.state.gridlines})
  }

  autoGeneration = {
    autoGenerate: '',
    startGenerate: () => {
      this.autoGeneration.stopGenerate()
      this.autoGenerate = setInterval(() => {this.nextGeneration()}, this.state.speed)
      this.setState({started: true})
    },
    stopGenerate: () => {
      clearInterval(this.autoGenerate)
      this.setState({started: false})
    }
  };

  render() {
    let cells = this.generateCells()

    return (
      <div className="app">
        <div className="board">{cells}</div>

        <Controls
          color={this.state.color}
          generation={this.state.generation_count}
          isStarted={this.state.started}
          onNext={this.nextGeneration.bind(this)}
          onStart={this.autoGeneration.startGenerate.bind(this)}
          onStop={this.autoGeneration.stopGenerate.bind(this)}
          onChange={this.changeColor.bind(this)}
          onRandom={this.handleRandom.bind(this)}
          onClear={this.handleClear.bind(this)}
          onSpeed={this.handleSpeed.bind(this)}
          population={this.state.population}
          speed={this.state.speed}
          toggleGrid={this.toggleGridlines.bind(this)}/>
      </div>
    )
  }
}

ReactDOM.render(<App cell_count="1600"/>, document.querySelector('.container'))
