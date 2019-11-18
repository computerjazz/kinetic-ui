import React, { Component } from 'react'
import { View, Dimensions, Text, Platform, StyleSheet } from 'react-native'
import Animated, { Easing } from 'react-native-reanimated';
import { PanGestureHandler, State, TapGestureHandler } from 'react-native-gesture-handler';
import BackButton from '../components/BackButton'
import MenuTitle from './MenuTitle';

const isAndroid = Platform.OS === 'android'

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

const numCards = 7
const flingThresh = 500

class Deck extends Component {

  constructor(props) {
    super(props)
    const { height, width, clock } = props
    const tickHeight = height * 0.75

    this.mainHandler = React.createRef()
    this.translationY = new Value(0)
    this.prevTrans = new Value(0)
    this.gestureState = new Value(State.UNDETERMINED)
    this.perspective = new Value(850)
    this._mounted = new Value(1)


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


    const previewState = {
      position: new Value(0),
      finished: new Value(0),
      time: new Value(0),
      velocity: new Value(0),
    }

    const previewConfig = {
      toValue: new Value(height / 2),
      damping: 8,
      mass: 1,
      stiffness: new Value(50.296),
      overshootClamping: false,
      restSpeedThreshold: 0.001,
      restDisplacementThreshold: 0.001,
    }

    const runClock = [
      cond(clockRunning(clock), [
        spring(clock, previewState, previewConfig),
        cond(previewState.finished, [
          stopClock(clock),
          set(previewState.finished, 0),
          set(previewState.time, 0),
          set(previewState.velocity, 0),
          set(previewConfig.toValue, 
            cond(greaterThan(previewConfig.toValue, 0), 0, height / 2)
            ),
          startClock(clock),
        ])
      ], [
        startClock(clock),
      ]),
      previewState.position
    ]

    const ry = Animated.interpolate(runClock, {
      inputRange: [0, height],
      outputRange: [0, 1],
    })

    this.cards = [...Array(numCards)].fill(0).map((d, i, arr) => {
      const colorMultiplier = 255 / (arr.length - 1)
      const index = new Value(i)
      const size = width * 0.75
      const gestureState = new Value(0)
      const midpoint = (arr.length - 1) / 2
      const maxIndex = arr.length - 1


      // 0: 10
      // 1: 5
      // 2: 0
      // 3: 5
      // 4: 10
      // midpoint: 2
      //

      // const maxY = height / (i + 1.75)
      const distFromMid = midpoint - i
      const ratio = distFromMid / midpoint
      const multiplier = ratio
      const maxY = multiplier * (height / 5)
      const scaleMultiplier = 1 - (i * (1 / arr.length))


      const iy = Animated.interpolate(ry, {
        inputRange: [-0.5, 0, 0.5],
        outputRange: [-maxY, i * 5, maxY],
      })

      const xOffset = width / 4
      const ix = multiply(
        abs(add(multiply(ry, cos(ratio), -xOffset), multiply(ry, xOffset))),
        -1)

      const rotateZ = Animated.interpolate(ry, {
        inputRange: [0, 1],
        outputRange: [0, multiplier * Math.PI / 2],
      })

      const scale = Animated.interpolate(ry, {
        inputRange: [-0.5, 0, 0.5],
        outputRange: [1, 1 + scaleMultiplier * 0.1, 1],
      })

      const colorIndex = i
      return {
        color: `rgba(${colorIndex * colorMultiplier}, ${Math.abs(128 - colorIndex * colorMultiplier)}, ${255 - (colorIndex * colorMultiplier)}, 0.9)`,
        scale,
        zIndex: -i,
        translateY: iy,
        translateX: ix,
        size,
        index: colorIndex,
        gestureState,
        rotateZ,
        touchScale: new Value(0),
        clock: new Clock(),
        state: {
          position: new Value(0),
          finished: new Value(0),
          time: new Value(0),
          frameTime: new Value(0),
        },
        config: {
          toValue: new Value(1),
          duration: 250,
          easing: Easing.inOut(Easing.ease),
        }
      }
    })
  }


  renderCard = ({
    color,
    scale,
    translateY,
    translateX,
    zIndex,
    size,
    rotateZ,
    gestureState,
    index,
    clock,
    state,
    config,
  }, i) => {
    const runClock = block([
      cond(clockRunning(clock), [
        timing(clock, state, config),
        cond(state.finished, [
          stopClock(clock),
          set(state.position, 0),
          set(state.frameTime, 0),
          set(state.time, 0),
          set(state.finished, 0),
        ]),
      ]),
      state.position,
    ])

    const ic = Animated.interpolate(runClock, {
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0.1, 0],
    })

    const scaleXY = add(scale, ic)

    return (
      <Animated.View
        key={`card-${i}`}

        style={{
          alignItems: 'center',
          justifyContent: 'center',
          position: 'absolute',
          width: size,
          height: size / 2,
          backgroundColor: color,
          borderRadius: 10,
          zIndex,
          opacity: 0.8,
          transform: [{
            translateY,
            translateX,
            scaleX: scaleXY,
            scaleY: scaleXY,
            rotateZ,
          }]
        }}
      >
        <Animated.View style={{
          flex: 1,
          width: size,
          alignItems: 'flex-end',
          justifyContent: 'flex-end',
          padding: 10
        }}>
          <Text style={{
            color: 'seashell',
            fontSize: 30,
            fontWeight: 'bold',
          }}>
            {}
          </Text>
        </Animated.View>
      </Animated.View>
    )
  }

  velocity = new Value(0)

  render() {
    return (
      <View style={{
        flex: 1,
        alignItems: 'center',
        width: '100%',
        padding: 30,
        overflow: 'hidden',
        backgroundColor: 'seashell',
        borderRadius: this.props.width,
      }}>
        <Animated.View style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {this.cards.map(this.renderCard)}
        </Animated.View>
      </View>

    )
  }
}

export default Deck