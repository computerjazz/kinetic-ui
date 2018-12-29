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
  divide,
  greaterThan,
  lessThan,
  spring,
  timing,
  block,
  floor,
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
  modulo,
  round,
} = Animated;

import BackButton from '../components/BackButton'

const size = width / 2 
const numCards = 7
const maxIndex = numCards - 1
const colorMultiplier = 255 / maxIndex

class Card extends Component {

  constructor() {
    super()
    this.startIndexY = new Value(0)

    this.translationX = new Value(0)
    this.translationY = new Value(0)
    this.gestureState = new Value(State.UNDETERMINED)
    this.prevX = new Value(0)
    this.prevY = new Value(0)

    this._cy = add(this.prevY, this.translationY)
    this._cx = add(this.prevX, this.translationX)

    this._iy = Animated.interpolate(this._cy, {
      inputRange: [-size, 0, size],
      outputRange: [180, 0, -180],
    })

    this._ix = Animated.interpolate(this._cx, {
      inputRange: [-size, 0, size],
      outputRange: [-180, 0, 180],
    })

    this.indexX = floor(divide(add(this._ix, 90), 180))
    this.indexY = floor(divide(add(this._iy, 90), 180))
    this.index = add(this.indexX, this.indexY)

    this.targetX= multiply(size, this.indexX)
    this.targetY= multiply(size, this.indexY, -1)

    this._mx = sub(modulo(add(this._ix, 90), 180), 90)
    this._my = sub(modulo(add(this._iy, 90), 180), 90)

    this._isInverted = modulo(sub(this.startIndexY, this.indexY), 2)

    this.rotateX = Animated.concat(this._my, 'deg')
    this.rotateY = Animated.concat([
      cond(this._isInverted, multiply(this._mx, -1), this._mx),
    ], 'deg')

    const colorIndex = sub(maxIndex, modulo(add(this.index, maxIndex), numCards))

    const c = multiply(colorIndex, colorMultiplier)
    const r = round(c)
    const g = round(abs(sub(128, c)))
    const b = round(sub(255, c))
    this.color = color(r, g, b)

    this.perspective = new Value(850)

    this.springState = {
      finished: new Value(0),
      velocity: new Value(0),
      position: new Value(0),
      time: new Value(0),
    };

    this.springConfig = {
      damping: 8,
      mass: 1,
      stiffness: 50.296,
      overshootClamping: false,
      toValue: new Value(1),
      restSpeedThreshold: 0.001,
      restDisplacementThreshold: 0.001,
    };

    this.clock = new Clock()

    const isActive = [
      cond(eq(this.gestureState, State.ACTIVE), 1, 0)
    ]

    const reset = [
      set(this.translationX, 0),
      set(this.translationY, 0),
      set(this.springState.position, 0),
      set(this.springState.finished, 0),
      set(this.springState.time, 0),
    ]

    const stopClockIfFinished = [
      cond(this.springState.finished, [
        reset,
        stopClock(this.clock),
      ])
    ]

    const stopClockIfStarted = [
      cond(clockRunning(this.clock), [
        stopClock(this.clock),
        set(this.springState.position, 0),
        set(this.springState.finished, 0),
        set(this.springState.time, 0),
      ])
    ]

    this.diffX = new Value(0)
    this.diffY = new Value(0)
    this._px = new Value(0)
    this._py = new Value(0)

    const startClockIfStopped = [
      cond(clockRunning(this.clock), 0, [
        set(this.prevY, add(this.prevY, this.translationY)),
        set(this.prevX, add(this.prevX, this.translationX)),

        set(this._px, this.prevX),
        set(this._py, this.prevY),

        set(this.diffX, sub(this.targetX, this.prevX)),
        set(this.diffY, sub(this.targetY, this.prevY)),

        set(this.translationX, 0),
        set(this.translationY, 0),

        startClock(this.clock)
      ]
      )
    ]

    this._x = block([
      cond(isActive, [
        stopClockIfStarted,
      ], [
            startClockIfStopped,
            cond(clockRunning(this.clock), [
              spring(this.clock, this.springState, this.springConfig),
              set(this.prevX, add(this._px, multiply(this.diffX, this.springState.position))),
              set(this.prevY, add(this._py, multiply(this.diffY, this.springState.position))),
            ]),
            stopClockIfFinished,     
      ]),
      this.rotateX,
    ])

    this._y = this.rotateY
  }

  render() {
    return (
      <PanGestureHandler
        onGestureEvent={event([{
          nativeEvent: ({ translationX: x, translationY: y }) => block([
            cond(eq(this.gestureState, State.ACTIVE), [
              set(this.translationX, x),
              set(this.translationY, y),
            ])
          ])
        }
        ])}
        onHandlerStateChange={event([{ 
          nativeEvent: ({ state }) => block([
            cond(and(neq(this.gestureState, State.ACTIVE), eq(state, State.ACTIVE)), [
              set(this.startIndexY, this.indexY),
            ]),
            set(this.gestureState, state),
          ])
        }])}
      >

        <Animated.View style={{ 
          flex: 1, 
          backgroundColor: 'seashell', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}
        >
        <Animated.View 
          style={{
            position: 'absolute',
            top: height / 2,
            right: width / 2,
            width: size * .75, 
            height: size * .75,
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            borderRadius: 5,
            zIndex: -999,
              transform: [
                {
                  perspective: this.perspective,
                  rotateX: this._x,
                  rotateY: this._y,
                }]
          }}
        />
          <Animated.View
            style={{
              opacity: 0.8,
              justifyContent: 'center',
              alignItems: 'center',
              width: size,
              height: size,
              backgroundColor: this.color,
              borderRadius: 5,
              transform: [
                {
                  perspective: this.perspective,
                  rotateX: this._x,
                  rotateY: this._y,
                }]
            }}
          >
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white'}}>{}</Text>
          </Animated.View>

          <BackButton color="#ddd" onPress={() => this.props.navigation.goBack(null)} />
        </Animated.View>
      </PanGestureHandler>
    )
  }
}

export default Card