import * as React from 'react'
import { Dimensions, View, StyleSheet } from 'react-native'
import Animated, { Easing } from 'react-native-reanimated'
import BackButton from '../components/BackButton'
import { PanGestureHandler } from 'react-native-gesture-handler';
const { height, width } = Dimensions.get('window')

const {
  onChange,
  debug,
  and,
  not,
  set,
  neq,
  cond,
  eq,
  or,
  add,
  multiply,
  greaterThan,
  lessThan,
  floor,
  spring,
  timing,
  divide,
  block,
  round,
  startClock,
  stopClock,
  clockRunning,
  sub,
  defined,
  Value,
  Clock,
  event,
  sin,
  modulo,
  abs,
  cos,
} = Animated;

const cardsPerRow = 8
const numCards = Math.pow(cardsPerRow, 2)
const cardSize = width / Math.sqrt(numCards)
const padding = cardSize / 20

class Grid extends React.Component {

  constructor() {
    super()
    this.panX = new Value(0)
    this.panY = new Value(0)
    this.screenX = new Value(0)
    this.screenY = new Value(0)

    this.cards = [...Array(numCards)].fill(0).map((d, i, arr) => {
      const row = Math.floor(i / cardsPerRow)
      const col = i - (cardsPerRow * row)
      const centerX = cardSize * row + cardSize / 2
      const centerY = cardSize * col + cardSize / 2
      console.log(`[${row}, ${col}]`)
      const colorMultiplier = 255 / (arr.length - 1)

      const wiggle = 2 * cardSize
      const diffX = Animated.interpolate(abs(sub(centerX, this.screenX)), {
        inputRange: [0, wiggle],
        outputRange: [1, 0],
        extrapolate: Animated.Extrapolate.CLAMP,
      })
      const diffY = Animated.interpolate(abs(sub(centerY, this.screenY)), {
        inputRange: [0, wiggle],
        outputRange: [1, 0],
        extrapolate: Animated.Extrapolate.CLAMP,
      })

      const ipx = Animated.interpolate(this.screenY, {
        inputRange: [centerX - wiggle, centerX + wiggle],
        outputRange: [0, 1],
        extrapolate: Animated.Extrapolate.CLAMP,
      })

      const ipy = Animated.interpolate(this.screenX, {
        inputRange: [centerY - wiggle, centerY + wiggle],
        outputRange: [0, 1],
        extrapolate: Animated.Extrapolate.CLAMP,
      })

      const rotateX = Animated.interpolate(multiply(ipx, diffY), {
        inputRange: [0, 1],
        outputRange: [0, Math.PI],
      })
      const rotateY = Animated.interpolate(multiply(ipy, diffX), {
        inputRange: [0, 1],
        outputRange: [0, -Math.PI],
      })
      return {
        color: `rgba(${i * colorMultiplier}, ${Math.abs(128 - i * colorMultiplier)}, ${255 - (i * colorMultiplier)}, 0.9)`,
        rotateX,
        rotateY,
      }
    })
  }

  renderCard = ({ color, rotateX, rotateY }, index) => {
    return (
      <Animated.View 
        key={`grid-card-${index}`}

      style={{
        width: cardSize,
        height: cardSize,
        padding,
      }}>
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: color,
            borderRadius: cardSize / 10,
            transform: [{
              rotateX,
              rotateY,
            }]
          }}
        />

      </Animated.View>
    )
  }

  render() {
    return (
      <View style={{
        flex: 1, 
        backgroundColor: 'seashell',
        alignItems: 'center', 
        justifyContent: 'center',

      }}>
      <PanGestureHandler
        onGestureEvent={event([{
          nativeEvent: ({ translationX, translationY, x, y }) => block([
            set(this.panX, translationX),
            set(this.panY, translationY),
            set(this.screenX, x),
            set(this.screenY, y),
          ])
        }])}
      >
      <Animated.View style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
      }}>
        {this.cards.map(this.renderCard)}
        </Animated.View>
        </PanGestureHandler>
        <BackButton color="#ddd" onPress={() => this.props.navigation.goBack(null)} />
      </View>
    )
  }
}

export default Grid