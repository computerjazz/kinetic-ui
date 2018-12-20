import React, { Component } from 'react'
import { StatusBar } from 'react-native'
import { createStackNavigator, createAppContainer } from 'react-navigation'

import Flower from './screens/Flower'
import Lanterns from './screens/Lanterns'
import Menu from './screens/Menu'
import Dot from './screens/Dot'
import CardRotate from './screens/CardRotate'
import CardFlip from './screens/CardFlip'
import CardStack from './screens/CardStack'
import CardCircle from './screens/CardCircle'

const Stack = createStackNavigator({
  Flower: { screen: Flower },
  Menu: { screen: Menu },
  Lanterns: { screen: Lanterns },
  Dot: { screen: Dot },
  Card: { screen: CardRotate },
  Stack: { screen: CardStack },
  Carousel: { screen: CardCircle },
  Flip: { screen: CardFlip },
}, {
  initialRouteName: 'Menu',
  headerMode: 'none',
})

const Navigator = createAppContainer(Stack)

export default class App extends Component {
  render() {
    return (
      <React.Fragment>
        <StatusBar hidden />

      <Navigator 
      persistenceKey={"NavigationState"} 
      />
      </React.Fragment>
    );
  }
}