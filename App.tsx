import React, { Component } from 'react'
import { StatusBar } from 'react-native'
import { createStackNavigator, createAppContainer } from 'react-navigation'
import { createFluidNavigator } from 'react-navigation-fluid-transitions'

import Flower from './screens/Flower'
import Lanterns from './screens/Lanterns'
import Menu from './screens/Menu'
import Dots from './screens/Dots'
import CardRotate from './screens/CardRotate'
import CardFlip from './screens/CardFlip'
import CardStack from './screens/CardStack'
import Carousel from './screens/Carousel'
import Deck from './screens/Deck'
import Grid from './screens/Grid'
import Book from './screens/Book'

const Stack = createStackNavigator({
  Flower: { screen: Flower },
  Menu: { screen: Menu },
  Lanterns: { screen: Lanterns },
  Dots: { screen: Dots },
  Card: { screen: CardRotate },
  Stack: { screen: CardStack },
  Carousel: { screen: Carousel },
  Deck: { screen: Deck },
  Flip: { screen: CardFlip },
  Grid: { screen: Grid },
  Book: { screen: Book },
}, {
  initialRouteName: 'Menu',
  headerMode: 'none',
  defaultNavigationOptions: {
    gesturesEnabled: false,
  },
})

const Navigator = createAppContainer(Stack)

export default class App extends Component {

  render() {
    return (
      <>
        <StatusBar hidden />
        <Navigator persistenceKey="app" />
      </>
    );
  }
}