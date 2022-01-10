import React from 'react'
import { StatusBar } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Navigator from "./nav/Navigator"

const App = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar hidden />
       <Navigator />
    </GestureHandlerRootView> 
  );
}

export default App    