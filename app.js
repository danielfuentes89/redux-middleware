//  Instancia middleware redux-thunk
const thunk = ReduxThunk.default;

//  state inicial de la aplicacion
const initialState = {
  lastAction: new String(),
  isPending: false,
  error: new String,
  data: {}
}

// REDUCER
function mainReducer(state = initialState, action) {
  //console.log(action)
  var nextState = state;
  nextState.lastAction = action.type;
  nextState.isPending = false;
  nextState.error = null;

  switch (action.type) {
    case 'getCountries':
      nextState.data.countries = action.data.continent.countries;
      return nextState;
      break;
    case 'getContinents':
      nextState.data.continents = action.data.continents;
      return nextState;
      break;
    case 'error':
      nextState.error = action.error;
      nextState.data = null;
      return nextState;
      break;
    case 'dataPending':
      nextState.isPending = true;
      return nextState;
      break;
    default:
      return state
  }
}

//  GraphQL Query getContinents
const queryContinents = `
  query{
    continents {
      name
      code
    }
  }
`;

//  GraphQL Query getCountries
const queryCountries = `
  query getCountries($code: String) {
    continent(code: $code) {
      countries {
        name
      }
    }
  }
`;

//  Funcion Fetch global para request api GraphQL
//  recibe: query y objeto con parametros para la query
function returnFetch(query, variables) {
  return fetch('https://countries.trevorblades.com/', {
    method: 'POST',
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: query,
      variables: variables
    })
  })
}

//  funcion asincrona invoca funcion returnFetch (fetch)
async function queryFetch(query, variables) {
  const respuesta = await returnFetch(query, variables)
  const json = await respuesta.json()

  if (respuesta.status !== 200)
    throw Error(respuesta.statusText);

  return json;
}

//  funcion pasada a thunk middleware para encapsular dispatchs
function fetchData(param) {

  return dispatch => {
    //  primer dispatch:  action para cargar loading mientras se concreta fecth
    dispatch({ type: 'dataPending' });
    queryFetch(param.query, param.variables)
      .then(res => {
        if (res.error) {
          throw (res.error);
        }
        
        //  segundo dispatch: action para agregar data retornada hacia nuevo state en reducer
        dispatch({ type: param.type, data: res.data });
      })
      .catch(error => {
        //  tercer dispatch: action para notificar si ocurrio un error en fetch
        dispatch({ type: 'error', error: error });
      })
  }
}

//  Funcion para renderizar listado <li> con countries al ul principal
function renderCountries(c) {
  let str = new String();
  c.map(x => {
    str += '<li>' + x.name + '</li>'
  })

  let ul = document.getElementById('ulCountries')
  ul.innerHTML = str
}
//  Funcion para renderizar listado <option> con continents al control select principal
function renderContinents(c) {
  let slct = document.getElementById('name')
  let o = new Option('seleccione..', '');
  slct.appendChild(o)
  
  c.map(x => {
    let opt = new Option(x.name, x.code);
    slct.appendChild(opt)
  })
}

// STORE
var store = Redux.createStore(mainReducer, Redux.applyMiddleware(thunk));

//  Funcion de renderizado y notificacion segun ultimo action recibido en reducer
function render() {
  var state = store.getState()
  switch (state.lastAction) {
    case 'getCountries':
      renderCountries(state.data.countries)
      break;
    case 'getContinents':
      renderContinents(state.data.continents)
      break;
    case 'error':
      //console.log('Error: ' + state.error)
      let ulerror = document.getElementById('ulCountries')
      ulerror.innerHTML = '<li>' + state.error + '</li>';
      break;
    case 'dataPending':
      //console.log('Pending:' + state.isPending)
      let ul = document.getElementById('ulCountries')
      ul.innerHTML = '<li>Loading..</li>';
      break;
    default:
      break;
  }

}

//  Ejecucion inicial de render
render()
//  suscribe al store la funcion de renderizado, como ultima accion del store frente a un action
store.subscribe(render)

// ACTIONS
document.getElementById('name')
  .addEventListener('change', function () {
    let variables = { code: this.value };
    let obj = { type: 'getCountries', query: queryCountries, variables: variables }
    store.dispatch(fetchData(obj))
  })

window.onload = function () {
  let obj = { type: 'getContinents', query: queryContinents }
  store.dispatch(fetchData(obj))
};