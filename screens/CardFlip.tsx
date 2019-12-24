import React, { Component } from 'react'
import { View, Dimensions, Text } from 'react-native'
import Animated from 'react-native-reanimated';
import { PanGestureHandler, State, TapGestureHandler } from 'react-native-gesture-handler';

const { width, height } = Dimensions.get('window');

const {
  debug,
  and,
  set,
  neq,
  cond,
  eq,
  add,
  multiply,
  divide,
  spring,
  block,
  floor,
  startClock,
  stopClock,
  clockRunning,
  sub,
  Value,
  Clock,
  event,
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

  indexY: Animated.Node<number>
  color: Animated.Node<number>
  _x: Animated.Node<number>
  _y: Animated.Node<number>
  runClock: Animated.Node<number>
  scale: Animated.Node<number>
  shadowScale: Animated.Node<number>

  startIndexY: Animated.Value<number> = new Value(0)
  translationX: Animated.Value<number> = new Value(0)
  translationY: Animated.Value<number> = new Value(0)
  gestureState: Animated.Value<State> = new Value(State.UNDETERMINED)
  tapState: Animated.Value<State> = new Value(State.UNDETERMINED)
  perspective: Animated.Value<number> = new Value(850)
  springState: Animated.SpringState = {
    finished: new Value(0),
    velocity: new Value(0),
    position: new Value(0),
    time: new Value(0),
  }
  springConfig: Animated.SpringConfig = {
    damping: 8,
    mass: 1,
    stiffness: 50.296,
    overshootClamping: false,
    toValue: new Value(1),
    restSpeedThreshold: 0.001,
    restDisplacementThreshold: 0.001,
  }
  tapSpr: Animated.SpringState = {
    finished: new Value(0),
    velocity: new Value(0),
    position: new Value(0),
    time: new Value(0),
  }
  tapCfg: Animated.SpringConfig = {
    damping: 12,
    mass: 1,
    stiffness: 100,
    overshootClamping: false,
    toValue: new Value(1),
    restSpeedThreshold: 0.01,
    restDisplacementThreshold: 0.01,
  }
  clock: Animated.Clock = new Clock()
  tapClock: Animated.Clock = new Clock()

  constructor(props) {
    super(props)
    const prevX = new Value(0)
    const prevY = new Value(0)
    const px = new Value(0)
    const py = new Value(0)
    const diffX = new Value(0)
    const diffY = new Value(0)

    const cumulativeY = add(prevY, this.translationY)
    const cumulativeX = add(prevX, this.translationX)

    const sizeInterpolatedY = Animated.interpolate(cumulativeY, {
      inputRange: [-size, 0, size],
      outputRange: [180, 0, -180],
    })

    const sizeInterpolatedX = Animated.interpolate(cumulativeX, {
      inputRange: [-size, 0, size],
      outputRange: [-180, 0, 180],
    })

    const indexX = floor(divide(add(sizeInterpolatedX, 90), 180))
    const indexY = floor(divide(add(sizeInterpolatedY, 90), 180))
    this.indexY = indexY
    const index = add(indexX, indexY)

    const targetX = multiply(size, indexX)
    const targetY = multiply(size, indexY, -1)

    const modX = sub(modulo(add(sizeInterpolatedX, 90), 180), 90)
    const modY = sub(modulo(add(sizeInterpolatedY, 90), 180), 90)

    const isInverted = modulo(sub(this.startIndexY, indexY), 2)

    const rotateX = Animated.concat(modY, 'deg')
    const rotateY = Animated.concat([
      cond(isInverted, multiply(modX, -1), modX),
    ], 'deg')

    const colorIndex = sub(maxIndex, modulo(add(index, maxIndex), numCards))

    const c = multiply(colorIndex, colorMultiplier)
    const r = round(c)
    const g = round(abs(sub(128, c)))
    const b = round(sub(255, c))
    this.color = color(r, g, b)

    const isActive = eq(this.gestureState, State.ACTIVE)

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

    const startClockIfStopped = [
      cond(clockRunning(this.clock), 0, [
        set(prevY, add(prevY, this.translationY)),
        set(prevX, add(prevX, this.translationX)),

        // NOTE: Order seems to matter for Android -- resetting translation
        // at the end of this block breaks android.
        set(this.translationX, 0),
        set(this.translationY, 0),

        set(px, prevX),
        set(py, prevY),

        set(diffX, sub(targetX, prevX)),
        set(diffY, sub(targetY, prevY)),

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
          set(prevX, add(px, multiply(diffX, this.springState.position))),
          set(prevY, add(py, multiply(diffY, this.springState.position))),
        ]),
        stopClockIfFinished,
      ]),
      rotateX,
    ])

    this._y = rotateY

    this.runClock = [
      cond(clockRunning(this.tapClock), [
        spring(this.tapClock, this.tapSpr, this.tapCfg),
        cond(this.tapSpr.finished, [
          stopClock(this.tapClock),
          set(this.tapSpr.position, 0),
          set(this.tapSpr.time, 0),
          set(this.tapSpr.velocity, 0),
          set(this.tapSpr.finished, 0),
        ])
      ]),
      this.tapSpr.position
    ]

    this.scale = Animated.interpolate(this.runClock, {
      inputRange: [0, 0.5, 1],
      outputRange: [1, 1.1, 1],
    })

    this.shadowScale = Animated.interpolate(this.runClock, {
      inputRange: [0, 0.5, 1],
      outputRange: [1, .95, 1],
    })
  }


  onPanGestureEvent = event([{
    nativeEvent: ({ translationX: x, translationY: y }) => block([
      cond(eq(this.gestureState, State.ACTIVE), [
        set(this.translationX, x),
        set(this.translationY, y),
      ])
    ])
  }
  ])

  onPanStateChange = event([{
    nativeEvent: ({ state }) => block([
      cond(and(neq(this.gestureState, State.ACTIVE), eq(state, State.ACTIVE)), [
        set(this.startIndexY, this.indexY),
      ]),
      set(this.gestureState, state),
    ])
  }])

  onTapStateChange = event([{
    nativeEvent: ({ state }) => block([
      cond(and(neq(this.tapState, State.END), eq(state, State.END)), [
        startClock(this.tapClock)
      ]),
      set(this.tapState, state)
    ])
  }])

  render() {
    return (
      <View style={{
        flex: 1,
        backgroundColor: 'seashell',
      }}
      >
        <PanGestureHandler
          onGestureEvent={this.onPanGestureEvent}
          onHandlerStateChange={this.onPanStateChange}
        >
          <Animated.View style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center'
          }}>
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
                    scaleX: this.shadowScale,
                    scaleY: this.shadowScale,
                  }]
              }}
            />
            <TapGestureHandler
              onHandlerStateChange={this.onTapStateChange}
            >
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
                      scaleX: this.scale,
                      scaleY: this.scale,
                    }]
                }}
              >
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>{}</Text>
              </Animated.View>
            </TapGestureHandler>
          </Animated.View>
        </PanGestureHandler>
        <BackButton />
      </View>
    )
  }
}

export default Card