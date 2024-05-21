import logo from './logo.svg';
import './App.css';
import {BrowserRouter as Router, Route} from 'react-router-dom'
import IndexPage from './Pages/IndexPage';
import WhitePadPage from './Pages/WhitePadPage';
import {socket, socketContext} from './Context/socket'

function App() {
  return (
    <socketContext.Provider value={socket}>
      <Router>
        <Route path='/' exact component={IndexPage}/>
        <Route path='/whitepad' component={WhitePadPage}/>
    </Router>
    </socketContext.Provider>
  );
}

export default App;
