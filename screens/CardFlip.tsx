import React, { Component } from 'react'
import { View, Dimensions, Text } from 'react-native'
import Animated, { Easing } from 'react-native-reanimated';
import { PanGestureHandler, State, TapGestureHandler } from 'react-native-gesture-handler';

const { width, height } = Dimensions.get('window');

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
  spring,
  timing,
  block,
  startClock,
  stopClock,
  clockRunning,
  sub,
  defined,
  Value,
  Clock,
  event,
  sin,
  color,
  abs,
  modulo
} = Animated;

import BackButton from '../components/BackButton'

class Card extends Component {

  constructor() {
    super()
    this.translationX = new Value(0)
    this.translationY = new Value(0)
    this.gestureState = new Value(State.UNDETERMINED)

    this._iy = Animated.interpolate(this.translationY, {
      inputRange: [-height / 2, 0, height / 2],
      outputRange: [180, 0, -180],
      extrapolate: Animated.Extrapolate.CLAMP,
    })

    this._ix = Animated.interpolate(this.translationX, {
      inputRange: [-width, 0, width],
      outputRange: [-180, 0, 180],
      extrapolate: Animated.Extrapolate.CLAMP,
    })

    this.rotateX = Animated.concat(this._iy,'deg')
    this.rotateY = Animated.concat(this._ix, 'deg')

    xPast90 = greaterThan(abs(this._ix), 90)
    yPast90 = greaterThan(abs(this._iy), 90)
    const orFlip = or(xPast90, yPast90)
    const nandFlip = not(and(xPast90, yPast90))
    const hasFlipped = and(orFlip, nandFlip)

    const numCards = 7
    const maxIndex = numCards - 1
    const colorMultiplier = 255 / (numCards - 1)

    const index = new Value(0)
    const colorIndex = modulo(sub(maxIndex, add(index, maxIndex)), numCards)

    const c = multiply(cond(hasFlipped, modulo(add(colorIndex, 1), numCards), colorIndex), colorMultiplier)
    const r = c
    const g = abs(sub(128, c))
    const b = sub(255, c)
    this.color = color(r, g, b, 0.9)


    this.perspective = new Value(850)

    this.springState = {
      finished: new Value(0),
      velocity: new Value(0),
      position: new Value(1),
      time: new Value(0),
    };

    this.springConfig = {
      damping: 8,
      mass: 1,
      stiffness: 50.296,
      overshootClamping: false,
      toValue: 0,
      restSpeedThreshold: 0.001,
      restDisplacementThreshold: 0.001,
    };

    this.clock = new Clock()
    this._lastX = new Value(0)
    this._lastY = new Value(0)

    const hasMoved = [
      cond(or(this.translationX, this.translationY), 1, 0)
    ]

    const isActive = [
      cond(eq(this.gestureState, State.ACTIVE), 1, 0)
    ]

    const startClockIfStopped = [
      cond(clockRunning(this.clock), 0, [
        set(this._lastY, this.translationY),
        set(this._lastX, this.translationX),
        startClock(this.clock)
      ]
      )
    ]

    const reset = [
      set(this._lastY, 0),
      set(this._lastX, 0),
      set(this.translationX, 0),
      set(this.translationY, 0),
      set(this.springState.position, 1),
      set(this.springState.finished, 0),
      set(this.springState.time, 0),
    ]

    const stopClockIfFinished = [
      cond(this.springState.finished, [
        reset,
        debug('done!', this.springState.finished),
        stopClock(this.clock),
      ])
    ]

    const stopClockIfStarted = [
      cond(clockRunning(this.clock), [
        stopClock(this.clock),
        set(this.springState.position, 1),
        set(this.springState.finished, 0),
        set(this.springState.time, 0),
      ])
    ]



    this._x = block([
      cond(isActive, [
        stopClockIfStarted,
        this.rotateX,
      ],
        cond(hasMoved, [
          startClockIfStopped,
          spring(this.clock, this.springState, this.springConfig),
          stopClockIfFinished,
          set(this.translationY, multiply(this._lastY, this.springState.position)),
          this.rotateX,
        ], this.rotateX))
    ])


    this._y = block([
      cond(isActive, this.rotateY,
        cond(hasMoved, [
          set(this.translationX, multiply(this._lastX, this.springState.position)),
          this.rotateY,
        ], this.rotateY)
      )
    ])
  }





  render() {
    return (
      <PanGestureHandler
        onGestureEvent={event([{
          nativeEvent: ({ translationX: x, translationY: y }) => block([
            set(this.translationX, x),
            set(this.translationY, y),
          ])
        }
        ])}
        onHandlerStateChange={event([{ nativeEvent: { state: this.gestureState } }])}
      >

        <Animated.View style={{ flex: 1, backgroundColor: 'seashell', alignItems: 'center', justifyContent: 'center' }}>

          <Animated.View
            style={{
              opacity: 0.9,
              justifyContent: 'center',
              alignItems: 'center',
              width: width / 2,
              backgroundColor: this.color,
              height: width / 2,
              borderRadius: 5,
              transform: [
                {
                  perspective: this.perspective,
                  rotateX: this._x,
                  rotateY: this._y,
                }]
            }}
          />

          <BackButton color="#ddd" onPress={() => this.props.navigation.goBack(null)} />
        </Animated.View>
      </PanGestureHandler>
    )
  }
}

export default Card