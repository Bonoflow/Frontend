export const environment = {
  production: false,
  firebaseConfig : {
    apiKey: "AIzaSyDqWllRlA141iH7T4yUMe2Fj855CYfP2r8",
    authDomain: "imagestorage-27f1c.firebaseapp.com",
    projectId: "imagestorage-27f1c",
    storageBucket: "imagestorage-27f1c.appspot.com",
    messagingSenderId: "120580471876",
    appId: "1:120580471876:android:025f67afd1f31cecdb5011"
  },

  // Trabajar de manera local
  baseURL: 'http://localhost:8080/api/v1',

  //urls for the different endpoints
  authenticationURL: '/authentication',
  userURL: '/users',
  profileURL: '/profiles',
  clientURL: '/clients',
  investorURL: '/investors',
  bondURL: '/bonds',
  cashFlowURL: '/cashflows',
  financialMetricURL: '/financial-metrics',
  configurationURL: '/configurations',
  investmentURL: '/investments',
}
