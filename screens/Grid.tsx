import * as React from 'react'
import { Dimensions, View, StyleSheet, Text } from 'react-native'
import Animated from 'react-native-reanimated'
import BackButton from '../components/BackButton'
import { PanGestureHandler, State } from 'react-native-gesture-handler';
const { width } = Dimensions.get('window')

const {
  and,
  set,
  neq,
  cond,
  eq,
  add,
  multiply,
  spring,
  block,
  startClock,
  stopClock,
  clockRunning,
  sub,
  Value,
  Clock,
  event,
  abs,
  min,
} = Animated;

const cardsPerRow = 8
const engageDist = width / 8

const numCards = Math.pow(cardsPerRow, 2)
const cardSize = width / Math.sqrt(numCards)
const influenceDist = width / 2 
const padding = cardSize / 20
const gravity = Math.PI / 2

class Grid extends React.Component {

  constructor() {
    super()
    this.pan = new Value(0)
    this.gestureState = new Value(State.UNDETERMINED),
    this.translationX = new Value(0)
    this.translationY = new Value(0)
    this.screenX = new Value(0)
    this.screenY = new Value(0)
    this.clock = new Clock()

    this.sprState = {
      finished: new Value(0),
      velocity: new Value(0),
      position: new Value(0),
      time: new Value(0),
    }

    this.sprConfig = {
      damping: 20,
      mass: 0.3,
      stiffness: 30,
      overshootClamping: false,
      toValue: new Value(0),
      restSpeedThreshold: 0.001,
      restDisplacementThreshold: 0.001,
    }

    const runClock = [
      cond(clockRunning(this.clock), [
        spring(this.clock, this.sprState, this.sprConfig),
        cond(this.sprState.finished, [
          stopClock(this.clock),
          set(this.sprState.finished, 0),
          set(this.sprState.velocity, 0),
          set(this.sprState.time, 0),
          set(this.sprState.position, 0),
          set(this.screenX, 0),
          set(this.screenY, 0),
        ])
      ]),
      this.sprState.position,
    ]

    this.panRatio = Animated.interpolate(this.pan, {
      inputRange: [0, engageDist],
      outputRange: [0, 1],
      extrapolate: Animated.Extrapolate.CLAMP,
    })

    const multiplier = min(add(this.panRatio, runClock), 1)

    this.cards = [...Array(numCards)].fill(0).map((d, i, arr) => {
      const row = Math.floor(i / cardsPerRow)
      const col = i - (cardsPerRow * row)
      const centerY = cardSize * row + cardSize / 2
      const centerX = cardSize * col + cardSize / 2
      // console.log(`[${row}, ${col}]`)
      const colorMultiplier = 255 / (arr.length - 1)

      const diffX = sub(centerX, this.screenX)
      const diffY = sub(centerY, this.screenY)

      const diffXRatio = Animated.interpolate(diffX, {
        inputRange: [-influenceDist, 0, influenceDist],
        outputRange: [-1, 0, 1],
        extrapolate: Animated.Extrapolate.CLAMP,
      })
      
      const diffYRatio = Animated.interpolate(diffY, {
        inputRange: [-influenceDist, 0, influenceDist],
        outputRange: [-1, 0, 1],
        extrapolate: Animated.Extrapolate.CLAMP,
      })

      const pctY = Animated.interpolate(diffYRatio, {
        inputRange: [-1, 0, 1],
        outputRange: [0, 1, 0],
        extrapolate: Animated.Extrapolate.CLAMP,
      })

      const pctX = Animated.interpolate(diffXRatio, {
        inputRange: [-1, 0, 1],
        outputRange: [0, 1, 0],
        extrapolate: Animated.Extrapolate.CLAMP,
      })

      const rotateAmtX = diffXRatio
      const rotateAmtY = diffYRatio

      const rotateY = Animated.interpolate(rotateAmtX, {
        inputRange: [-1, -0.25, 0, 0.25, 1],
        outputRange: [0, -gravity, 0, gravity, 0],
        extrapolate: Animated.Extrapolate.CLAMP,
      })

      const rotateX = Animated.interpolate(rotateAmtY, {
        inputRange: [-1, -0.25, 0, 0.25, 1],
        outputRange: [0, gravity, 0, -gravity, 0],
        extrapolate: Animated.Extrapolate.CLAMP,
      })

      const color = `rgba(${i * colorMultiplier}, ${Math.abs(128 - i * colorMultiplier)}, ${255 - (i * colorMultiplier)}, 0.9)`

      return {
        color,
        rotateX: multiply(rotateX, pctX, multiplier),
        rotateY: multiply(rotateY, pctY, multiplier),
        scale: Animated.interpolate(multiply(add(pctX, pctY), multiplier), {
          inputRange: [0, 2],
          outputRange: [1, 0.85],
        })
      }
    })
  }

  renderCard = ({ color, rotateX, rotateY, scale }, index) => {
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
              scaleX: scale,
              scaleY: scale,
            }]
          }}
        >
        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14}}>{}</Text>
        </Animated.View>

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
          nativeEvent: ({ translationX, translationY, x, y, state }) => block([
            cond(eq(this.gestureState, State.ACTIVE), [
              cond(clockRunning(this.clock), [
                stopClock(this.clock),
                set(this.sprState.finished, 0),
                set(this.sprState.velocity, 0),
                set(this.sprState.time, 0),
                set(this.sprState.position, 0),
              ]),
              set(this.pan, 
                add(
                  this.pan, 
                  abs(sub(this.translationX, translationX)),
                  abs(sub(this.translationY, translationY)),
                  )
              ),
              set(this.translationX, translationX),
              set(this.translationY, translationY),
              set(this.screenX, x),
              set(this.screenY, y),
            ])
          ])
        }])}
        onHandlerStateChange={event([{
          nativeEvent: ({ state }) => block([
            cond(and(neq(state, State.ACTIVE), eq(this.gestureState, State.ACTIVE)), [
              set(this.sprState.position, this.panRatio),
              set(this.pan, 0),
              set(this.translationX, 0),
              set(this.translationY, 0),
              startClock(this.clock),
            ]),
            set(this.gestureState, state)
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
        <BackButton onPress={() => this.props.navigation.goBack(null)} />
      </View>
    )
  }
}

export default Grid