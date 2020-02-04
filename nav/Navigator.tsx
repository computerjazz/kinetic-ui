import { createStackNavigator, createAppContainer } from 'react-navigation'

import Flower from '../screens/Flower'
import Lanterns from '../screens/Lanterns'
import Menu from '../screens/Menu'
import Dots from '../screens/Dots'
import CardRotate from '../screens/CardRotate'
import CardFlip from '../screens/CardFlip'
import CardStack from '../screens/CardStack'
import Carousel from '../screens/Carousel'
import Deck from '../screens/Deck'
import Grid from '../screens/Grid'
import Book from '../screens/Book'
import { transitionConfig } from './transitions'

const Stack = createStackNavigator({
  Flower: Flower,
  Menu: Menu,
  Lanterns: Lanterns,
  Dots: Dots,
  Card: CardRotate,
  Stack: CardStack,
  Carousel: Carousel,
  Deck: Deck,
  Flip: CardFlip,
  Grid: Grid,
  Book: Book,
}, {
  initialRouteName: 'Menu',
  headerMode: 'none',
  defaultNavigationOptions: {
    gesturesEnabled: false,
  },
  transitionConfig,
})

const Navigator = createAppContainer(Stack)
export default Navigator