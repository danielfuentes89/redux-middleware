//  Instancia middleware redux-thunk
const thunk = ReduxThunk.default;

//  state inicial de la aplicacion
const initialState = {
  lastAction: null,
  isPending: false,
  error: null,
  data: {}
}

// REDUCER
function counterReducer(state = initialState, action) {
  console.log(action)
  var nextState = state;
  nextState.lastAction = action.type;
  nextState.isPending = false;
  nextState.error = null;
  switch (action.type) {
    case 'search':
      nextState.data.countries = action.countries;
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
const queryBase = `
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
async function queryFetch(query, continentCode) {
  const respuesta = await returnFetch(query, { code: continentCode })
  const json = await respuesta.json()

  if (respuesta.status !== 200)
    throw Error('Continente no existe');

  return json;
}

// const primerMiddleware = store => next => action => {
//     queryFetch(queryBase,action.continent)
//     .then(result => {
//       action.countries = result.data.continent.countries
//       next(action)
//     }
//     )
//     .catch(e => {
//       next({
//               type : 'error',
//               error : e
//           })
//     }
//       )
// }

//  funcion pasada a thunk middleware para encapsular dispatchs
function fetchData(parameterToMutation) {

  return dispatch => {
    //  primer dispatch:  action para cargar loading mientras se concreta fecth
    dispatch({ type: 'dataPending' });
    queryFetch(queryBase, parameterToMutation.continent)
      .then(res => {
        if (res.error) {
          throw (res.error);
        }
        //  segundo dispatch: action para agregar data retornada hacia nuevo state en reducer
        dispatch({ type: 'search', countries: res.data.continent.countries });
        return
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
  c.forEach(x => {
    str += '<li>' + x.name + '</li>'
  })

  let ul = document.getElementById('ulCountries')
  ul.innerHTML = str
}

// STORE
var store = Redux.createStore(counterReducer, Redux.applyMiddleware(thunk));
var counterEl = document.getElementById('counter');

//  Funcion de renderizado y notificacion segun ultimo action recibido en reducer
function render() {
  var state = store.getState()
  switch (state.lastAction) {
    case 'search':
      renderCountries(state.data.countries)
      break;
    case 'error':
      console.log('Error: ' + state.error)
      let ulerror = document.getElementById('ulCountries')
      ulerror.innerHTML = '<li>' + state.error + '</li>';
      break;
    case 'dataPending':
      console.log('Pending:' + state.isPending)
      let ul = document.getElementById('ulCountries')
      ul.innerHTML = '<li>Loading..</li>';
      break;
    default:
      break;
  }

}

//ejecucion inicial de render
render()
//  suscribe al store la funcion de renderizado, como ultima accion del store frente a un action
store.subscribe(render)

// ACTIONS
document.getElementById('name')
  .addEventListener('change', function () {
    let obj = { continent: this.value }
    store.dispatch(fetchData(obj))
  })

