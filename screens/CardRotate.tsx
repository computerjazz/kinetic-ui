import React, { Component } from 'react'
import { Dimensions, SafeAreaView } from 'react-native'
import Animated, { concat } from 'react-native-reanimated';
import { PanGestureHandler, State } from 'react-native-gesture-handler';

const { width, height } = Dimensions.get('window');

const {
  debug,
  set,
  cond,
  eq,
  or,
  multiply,
  spring,
  block,
  startClock,
  stopClock,
  clockRunning,
  Value,
  Clock,
  event,
} = Animated;

import BackButton from '../components/BackButton'

class Card extends Component {

  translationX: Animated.Value<number>
  translationY: Animated.Value<number>
  perspective: Animated.Value<number>
  gestureState: Animated.Value<State>
  rotateX: Animated.Node<string>
  rotateY: Animated.Node<string>
  springState: Animated.SpringState
  springConfig: Animated.SpringConfig
  clock: Animated.Clock
  _x: Animated.Node<number>
  _y: Animated.Node<number>
  _lastX: Animated.Value<number>
  _lastY: Animated.Value<number>

  constructor() {
    super()
    this.translationX = new Value(0)
    this.translationY = new Value(0)
    this.gestureState = new Value(State.UNDETERMINED)


    this.rotateX = Animated.concat(
      Animated.interpolateNode(this.translationY, {
        inputRange: [-height / 2, 0, height / 2],
        outputRange: [180, 0, -180],
        extrapolate: Animated.Extrapolate.CLAMP,
      }),
      'deg',
    )

    this.rotateY = Animated.concat(
      Animated.interpolateNode(this.translationX, {
        inputRange: [-width, 0, width],
        outputRange: [-180, 0, 180],
        extrapolate: Animated.Extrapolate.CLAMP,
      }),
      'deg',
    )

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
          <SafeAreaView style={{ flex: 1 }}>
            <Animated.View
              style={{
                opacity: 0.9,
                justifyContent: 'center',
                alignItems: 'center',
                width: width / 2,
                backgroundColor: 'tomato',
                height: height / 2,
                borderRadius: 5,
                zIndex: 100,
                transform: [
                  { perspective: this.perspective },
                  { rotateX: concat(this._x, "deg") },
                  { rotateY: concat(this._y, "deg") },
                ]
              }}
            />
            <Animated.View
              style={{
                opacity: 0.9,
                position: 'absolute',
                justifyContent: 'center',
                alignItems: 'center',
                width: width / 2,
                backgroundColor: 'dodgerblue',
                height: height / 2,
                zIndex: this.translationX,
                borderRadius: 5,
                transform: [
                  { translateY: 20 },
                  { perspective: this.perspective },
                  { rotateX: concat(this._x, "deg") },
                  { rotateY: concat(this._y, "deg") },
                  { scale: 1.5 },
                ]
              }}
            />

          </SafeAreaView>
          <BackButton />
        </Animated.View>
      </PanGestureHandler>
    )
  }
}

export default Card