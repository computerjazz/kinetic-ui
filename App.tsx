import React from 'react'
import { StatusBar } from 'react-native'
import Navigator from './nav/Navigator'

const App = () => {
  return (
    <>
      <StatusBar hidden />
      <Navigator />
    </>
  );
}

export default App