import React from 'react'
import { NavigationContainer } from '@react-navigation/native';

import Menu from "../screens/Menu"
import Dots from '../screens/Dots'
import CardRotate from '../screens/CardRotate'
import CardFlip from '../screens/CardFlip' 
import CardStack from '../screens/CardStack'
import Carousel from '../screens/Carousel'
import Deck from '../screens/Deck'
import Grid from '../screens/Grid' 
import Book from '../screens/Book'               

import { createStackNavigator } from '@react-navigation/stack';
const Stack = createStackNavigator()

const screens = {
  Menu,
  Dots,
  Card: CardRotate,
  Stack: CardStack,
  Carousel,
  Deck,
  Flip: CardFlip,   
  Grid,
  Book,
} 

export default function Navigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName='Menu'
        screenOptions={{ headerShown: false }}
        >            
        {Object.entries(screens).map(([k, v]) => {
          return (
            <Stack.Screen 
              key={k}
              name={k}
              component={v}   
            />
          )
        })}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
