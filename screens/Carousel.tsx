import React, { Component } from 'react'
import { View, Dimensions, Text } from 'react-native'
import Animated, { Easing } from 'react-native-reanimated';
import { PanGestureHandler, State, TapGestureHandler, TapGestureHandlerStateChangeEvent, PanGestureHandlerStateChangeEvent, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';

const { width, height } = Dimensions.get('window');

const {
  debug,
  onChange,
  and,
  not,
  set,
  neq,
  cond,
  eq,
  or,
  add,
  multiply,
  lessThan,
  interpolate,
  greaterThan,
  spring,
  timing,
  block,
  startClock,
  stopClock,
  clockRunning,
  sub,
  Value,
  Clock,
  event,
  sin,
  modulo,
  abs,
  diff,
  min,
} = Animated;

import BackButton from '../components/BackButton'

interface Props {
  navigation: any
}

class Carousel extends Component<Props> {

  mainHandler: React.RefObject<PanGestureHandler>
  translationX: Animated.Value<number>
  prevTrans: Animated.Value<number>
  cumulativeTrans: Animated.Value<number>
  perspective: Animated.Value<number>
  panGestureState: Animated.Value<State>
  tapGestureState: Animated.Value<State>
  activeCardIndex: Animated.Value<number>
  clock: Animated.Clock
  altClock: Animated.Clock
  _mounted: Animated.Value<number>
  _prevLeanAmt: Animated.Value<number>
  animState: Animated.TimingState
  animConfig: Animated.TimingConfig
  altState: Animated.SpringState
  altConfig: Animated.SpringConfig

  onTapStateChange: (e: TapGestureHandlerStateChangeEvent) => void
  onPanStateChange: (e: PanGestureHandlerStateChangeEvent) => void
  onPanGestureEvent: (e: PanGestureHandlerGestureEvent) => void
  cards

  constructor(props) {
    super(props)
    this.mainHandler = React.createRef()

    this.translationX = new Value(0)
    this.prevTrans = new Value(0)
    this.cumulativeTrans = new Value(0)
    this.panGestureState = new Value(State.UNDETERMINED)
    this.tapGestureState = new Value(State.UNDETERMINED)
    this.perspective = new Value(850)
    this.activeCardIndex = new Value(0)
    this.perspective = new Value(850)
    this.clock = new Clock()
    this.altClock = new Clock()
    this._mounted = new Value(1)


    this.animState = {
      finished: new Value(0),
      position: new Value(0),
      frameTime: new Value(0),
      time: new Value(0),
    }

    this.animConfig = {
      toValue: new Value(0),
      duration: new Value(5000),
      easing: Easing.out(Easing.ease),
    }


    this.altState = {
      finished: new Value(0),
      position: new Value(0),
      velocity: new Value(0),
      time: new Value(0),
    }

    this.altConfig = {
      damping: 15,
      mass: 1,
      stiffness: 150,
      overshootClamping: false,
      toValue: new Value(0),
      restSpeedThreshold: 0.001,
      restDisplacementThreshold: 0.001,
    }

    const numCards = 7
    const tickWidth = width / 2
    const size = width * 0.8
    const maxIndex = numCards - 1

    const cumulativeTrans = add(this.prevTrans, this.translationX, this.animState.position) // TODO: figure out how to do this without inverting
    const colorMultiplier = 255 / maxIndex
    const runClock = [
      cond(clockRunning(this.clock), [
        timing(this.clock, this.animState, this.animConfig),
        cond(
          or(
            not(this._mounted),
            and(this.animState.finished, clockRunning(this.clock))
          ),
          [
            stopClock(this.clock),
            set(this.prevTrans, add(this.prevTrans, this.animState.position)),
            set(this.animState.position, 0),
            set(this.animState.time, 0),
            set(this.animState.frameTime, 0),
            set(this.animState.finished, 0),
          ]),
      ]),
      cond(clockRunning(this.altClock), [
        spring(this.altClock, this.altState, this.altConfig),
        cond(and(eq(this.altState.finished, 1), clockRunning(this.altClock)), [
          stopClock(this.altClock),
          set(this.altState.time, 0),
          set(this.altState.velocity, 0),
          set(this.altState.finished, 0),
          set(this.altState.position, 0),
        ]),
      ])
    ]

    this._prevLeanAmt = new Value(0)
    const prevDiff = new Value(0)
    const absTrans = abs(cumulativeTrans)
    const diffAmt = diff(absTrans)
    const diffOfTheDiff = diff(diffAmt)
    const diffSmoothed = cond(
      or(
        lessThan(abs(diffOfTheDiff), 1),
        eq(this.tapGestureState, State.BEGAN),
      )
      , [
        diffOfTheDiff,
        set(prevDiff, diffAmt),
        diffAmt,
      ], prevDiff)

    const diffScaled = multiply(diffSmoothed, 0.005)

    const leanAmt = block([
      runClock,
      onChange(diffScaled, [
        set(this._prevLeanAmt, diffScaled),
      ]),
      diffScaled,
    ])

    this.cards = [...Array(numCards)].fill(0).map((_d, i, arr) => {
      // Somehow the top of the stack ended up as index 0
      // but the next item down is arr.length - 1
      // for example, indices would go
      // 0
      // 4
      // 3
      // 2
      // 1
      // `colorIndex` compensates for this
      const colorIndex = maxIndex - (i + maxIndex) % (arr.length)
      const index = new Value(i)
      const cardTransY = new Value(0)
      const cardGestureState = new Value(0)
      const cardClock = new Clock()
      const cardState = {
        finished: new Value(0),
        position: new Value(1),
        velocity: new Value(0),
        time: new Value(0),
      }

      const cardConfig = {
        damping: 15,
        mass: 1,
        stiffness: 150,
        overshootClamping: false,
        toValue: new Value(0),
        restSpeedThreshold: 0.001,
        restDisplacementThreshold: 0.001,
      }

      const interpolated = interpolate(cumulativeTrans, {
        inputRange: [-tickWidth, 0, tickWidth],
        outputRange: [sub(index, 1), index, add(index, 1)],
      })

      const transToIndex = modulo(interpolated, arr.length)

      const rotateX = multiply(min(0.2, abs(add(leanAmt, this.altState.position))), -1)
      const rotateY = interpolate(transToIndex, {
        inputRange: [0, numCards],
        outputRange: [0, Math.PI * 2],
      })

      const translateX = multiply(width / 3, sin(rotateY))
      const translateY = 0

      const scaleXY = add(1,
        multiply(0.15, sin(add(Math.PI / 2, rotateY))),
      )

      const zIndex = interpolate(transToIndex, {
        inputRange: [0, arr.length / 2, arr.length],
        outputRange: [200, 0, 200],
        extrapolate: Animated.Extrapolate.CLAMP,
      })

      return {
        color: `rgba(${colorIndex * colorMultiplier}, ${Math.abs(128 - colorIndex * colorMultiplier)}, ${255 - (colorIndex * colorMultiplier)}, 0.9)`,
        scale: scaleXY,
        zIndex,
        translateX,
        translateY,
        size,
        rotateY,
        rotateX,
        index: i,
        perspective: this.perspective,
        handlerRef: React.createRef(),
        cardState,
        cardConfig,
        cardTransY,
        cardClock,
        cardGestureState,
      }
    })

    this.onTapStateChange = event([
      {
        nativeEvent: ({ state }) => block([
          set(this.tapGestureState, state),
          onChange(this.tapGestureState, [
            cond(eq(this.tapGestureState, State.BEGAN), [
              set(this.animConfig.toValue, 0),
              cond(clockRunning(this.clock), [
                set(this.altState.position, this._prevLeanAmt),
                startClock(this.altClock),
                stopClock(this.clock),
                set(this.prevTrans, add(this.prevTrans, this.animState.position)),
                set(this.animState.position, 0),
                set(this.animState.time, 0),
                set(this.animState.frameTime, 0),
                set(this.animState.finished, 0)
              ])
            ])
          ])
        ])
      }
    ])

    this.onPanGestureEvent = event([{
      nativeEvent: ({ translationX: x, velocityX }) => block([
        cond(eq(this.panGestureState, State.ACTIVE), [
          set(this.translationX, x),
          set(this.animConfig.toValue, velocityX),
        ])
      ])
    }])

    this.onPanStateChange = event([{
      nativeEvent: ({ state }) => block([
        set(this.panGestureState, state),
        onChange(this.panGestureState, [
          cond(eq(this.panGestureState, State.ACTIVE), [
            cond(clockRunning(this.clock), [
              stopClock(this.clock),
              set(this.animState.time, 0),
              set(this.animState.position, 0),
              set(this.animState.frameTime, 0),
              set(this.animState.finished, 0)
            ]),
          ]),

          cond(eq(this.panGestureState, State.END),
            [
              set(this.prevTrans, add(this.translationX, this.prevTrans)),
              set(this.translationX, 0),
              cond(clockRunning(this.clock), [
                stopClock(this.clock),
                set(this.animState.time, 0),
                set(this.animState.position, 0),
                set(this.animState.frameTime, 0),
                set(this.animState.finished, 0)
              ]),
              cond(greaterThan(abs(this.animConfig.toValue), 0), [
                set(this.animConfig.duration, 5000),
                set(this.animState.time, 0),
                set(this.animState.position, 0),
                set(this.animState.frameTime, 0),
                set(this.animState.finished, 0),
                startClock(this.clock),
              ]),
            ]),
        ]),
      ])
    }]
    )
  }



  renderCard = ({ handlerRef, cardTransY, cardClock, cardState, cardConfig, cardGestureState, color, scale, translateX, translateY, zIndex, rotateY, rotateX, size, perspective }, i) => {
    // @NOTE: PanGestureHandler should not directly wrap an element that can rotate completely on edge.
    // this causes values to go to infinity.
    return (
      <PanGestureHandler
        key={`card-${i}`}
        ref={handlerRef}
        simultaneousHandlers={this.mainHandler}
        onGestureEvent={event([{
          nativeEvent: ({ translationY, state }) => block([
            cond(eq(cardGestureState, State.ACTIVE), [
              set(cardTransY, translationY),
            ])
          ])
        }])}
        onHandlerStateChange={event([{
          nativeEvent: ({ state }) => block([
            cond(
              and(neq(state, State.ACTIVE), eq(cardGestureState, State.ACTIVE)), [
              startClock(cardClock),
            ]),
            cond(and(eq(state, State.ACTIVE), clockRunning(cardClock)), [
              stopClock(cardClock),
              set(cardState.position, 1),
              set(cardState.finished, 0),
              set(cardState.time, 0),
              set(cardState.velocity, 0),
              set(cardTransY, 0),
            ]),
            set(cardGestureState, state),
          ])
        }])}
      >
        <Animated.View style={{
          zIndex,
          position: 'absolute',
          alignItems: 'center',
          justifyContent: 'center',
          width: size / 4,
          height: size,
          transform: [{
            perspective,
            translateX,
            scaleX: scale,
            scaleY: scale,
          }]
        }}>
          <Animated.View
            style={{
              position: 'absolute',
              alignItems: 'center',
              justifyContent: 'center',
              width: size / 4,
              height: size,
              backgroundColor: color,
              borderRadius: 10,
              zIndex,
              transform: [{
                perspective,
                translateY: block([
                  cond(and(clockRunning(cardClock), cardState.finished), [
                    stopClock(cardClock),
                    set(cardState.position, 1),
                    set(cardState.finished, 0),
                    set(cardState.time, 0),
                    set(cardState.velocity, 0),
                    set(cardTransY, 0),
                  ]),
                  cond(clockRunning(cardClock), [
                    spring(cardClock, cardState, cardConfig),
                    multiply(add(translateY, cardTransY), cardState.position),
                  ], [
                    add(translateY, cardTransY),
                  ]),
                ]),
                rotateY,
                rotateX,
              }]
            }}
          />
        </Animated.View>
      </PanGestureHandler>
    )
  }

  velocity = new Value(0)

  componentDidMount() {
    this.willBlurSub = this.props.navigation.addListener('willBlur', () => {
      this._mounted.setValue(0)
    })
  }

  componentWillUnmount() {
    this.willBlurSub && this.willBlurSub.remove()
  }

  render() {
    return (
      <View style={{
        flex: 1,
        backgroundColor: 'seashell',
      }}>
        <PanGestureHandler
          ref={this.mainHandler}
          onGestureEvent={this.onPanGestureEvent}
          onHandlerStateChange={this.onPanStateChange}
        >
          <Animated.View style={{ flex: 1 }}>
            <TapGestureHandler
              maxDist={0}
              simultaneousHandlers={this.mainHandler}
              onHandlerStateChange={this.onTapStateChange}
            >
              <Animated.View style={{
                flex: 1,
                marginTop: 50,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {this.cards.map(this.renderCard)}
              </Animated.View>
            </TapGestureHandler>
          </Animated.View>
        </PanGestureHandler>
        <BackButton />
      </View>
    )
  }
}

export default Carousel