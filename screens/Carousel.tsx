import React, { Component, useRef } from 'react'
import { View, Dimensions, Platform } from 'react-native'
import Animated, { EasingNode as Easing, 
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
  greaterThan,
  timing,
  block,
  startClock,
  stopClock,
  clockRunning,
  Value,
  Clock,
  event,
  abs,
  diff,
  call,
  concat,
} from 'react-native-reanimated';
import { GestureDetector, PanGestureHandler, PinchGestureHandler, RotationGestureHandler, State, TapGestureHandler } from 'react-native-gesture-handler';

const isAndroid = Platform.OS === "android"

const { width } = Dimensions.get('window');
import spring from '../procs/springFill'
import procs from '../procs/carousel'


import BackButton from '../components/BackButton'
import { NativeStackScreenProps } from '@react-navigation/native-stack';

const numCards = 7
const tickWidth = width / 2
const size = width * 0.8
const maxIndex = numCards - 1
const colorMultiplier = 255 / maxIndex

type Props = NativeStackScreenProps<any>

class Carousel extends Component<Props> {

  willBlurSub
  mainHandler = React.createRef<PanGestureHandler>()
  translationX = new Value<number>(0)
  prevTrans = new Value<number>(0)
  perspective = new Value<number>(850)
  panGestureState = new Value(State.UNDETERMINED)
  tapGestureState = new Value(State.UNDETERMINED)
  activeCardIndex = new Value<number>(0)
  clock = new Clock()
  altClock = new Clock()
  _mounted = new Value<number>(1)

  _prevLeanAmt = new Value<number>(0)

  animState: Animated.TimingState = {
    finished: new Value(0),
    position: new Value(0),
    frameTime: new Value(0),
    time: new Value(0),
  }
  animConfig: Animated.TimingConfig = {
    toValue: new Value(0),
    duration: new Value(5000),
    //@ts-ignore 
    easing: Easing.out(Easing.ease),
  }
  altState: Animated.SpringState = {
    finished: new Value(0),
    position: new Value(0),
    velocity: new Value(0),
    time: new Value(0),
  }
  altConfig: Animated.SpringConfig = {
    damping: 15,
    mass: 1,
    stiffness: 150,
    overshootClamping: false,
    toValue: new Value<number>(0),
    restSpeedThreshold: 0.001,
    restDisplacementThreshold: 0.001,
  }

  cumulativeTrans = add(this.prevTrans, this.translationX, this.animState.position)
  diffAmt = diff(abs(this.cumulativeTrans))
  prevDiff = new Value<number>(0)
  diffSmoothed = procs.getDiffSmoothed(this.tapGestureState, this.prevDiff, this.diffAmt)
  leanAmt = multiply(this.diffSmoothed, 0.005)
  onTapStateChange = event([
    {
      nativeEvent: ({ state }) => block([
        set(this.tapGestureState, state),
        onChange(this.tapGestureState, [
          cond(eq(this.tapGestureState, State.BEGAN), [
            //@ts-ignore 
            set(this.animConfig.toValue, 0),
            cond(clockRunning(this.clock), [
              set(this.altState.position, this._prevLeanAmt),
              startClock(this.altClock),
              stopClock(this.clock),
              set(this.prevTrans, this.cumulativeTrans),
              procs.reset4(this.animState.time, this.animState.position, this.animState.frameTime, this.animState.finished),
            ])
          ])
        ])
      ])
    }
  ])

  onPanStateChange = event([{
    nativeEvent: ({ state }) => block([
      
      set(this.panGestureState, state),
      onChange(this.panGestureState, [
        cond(eq(this.panGestureState, State.ACTIVE), [
          cond(clockRunning(this.clock), [
            stopClock(this.clock),
            procs.reset4(this.animState.time, this.animState.position, this.animState.frameTime, this.animState.finished),
          ]),
        ]),

        cond(eq(this.panGestureState, State.END),
          [
            set(this.prevTrans, add(this.translationX, this.prevTrans)),
            set(this.translationX, 0),
            cond(clockRunning(this.clock), [
              stopClock(this.clock),
              procs.reset4(this.animState.time, this.animState.position, this.animState.frameTime, this.animState.finished),
            ]),
            cond(greaterThan(abs(this.animConfig.toValue), 0), [
              //@ts-ignore 
              set(this.animConfig.duration, 5000),
              procs.reset4(this.animState.time, this.animState.position, this.animState.frameTime, this.animState.finished),
              startClock(this.clock),
            ]),
          ]),
      ]),
    ])
    }]
    )

  onPanGestureEvent = event([{
    nativeEvent: ({ translationX: x, velocityX }) => block([
      cond(eq(this.panGestureState, State.ACTIVE), [
        set(this.translationX, x),
        //@ts-ignore 
        set(this.animConfig.toValue, velocityX),
      ])
    ])
  }])

  cards = [...Array(numCards)].fill(0).map((_d, i, arr) => {
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

    const transToIndex = procs.getTransToIndex(this.cumulativeTrans, tickWidth, index, arr.length)
    const rotateX = procs.getRotateX(this.leanAmt, this.altState.position)
    const rotateY = procs.getRotateY(transToIndex, numCards)
    const translateX = procs.getTranslateX(rotateY, width / 3)
    const scaleXY = procs.getScaleXY(rotateY)
    const zIndex = procs.getZIndex(transToIndex, arr.length)
    const translateY = 0

    const onHandlerStateChange = event([{
      nativeEvent: ({ state }) => block([
        cond(
          and(neq(state, State.ACTIVE), eq(cardGestureState, State.ACTIVE)), [
          startClock(cardClock),
        ]),
        cond(and(eq(state, State.ACTIVE), clockRunning(cardClock)), [
          stopClock(cardClock),
          set(cardState.position, 1),
          procs.reset4(cardState.finished, cardState.time, cardState.velocity, cardTransY),
        ]),
        set(cardGestureState, state),
      ])
    }])

    const onGestureEvent = event([{
      nativeEvent: ({ translationY }) => block([
        cond(eq(cardGestureState, State.ACTIVE), [
          set(cardTransY, translationY),
        ])
      ])
    }])
    
    const innerTransform = [
      {perspective: this.perspective},
      {translateY: cond(clockRunning(cardClock), [
        spring(cardClock, cardState, cardConfig),
        multiply(add(translateY, cardTransY), cardState.position),
      ], add(translateY, cardTransY))},
      {rotateY: isAndroid ? concat(rotateY, "deg") : rotateY},
      {rotateX: isAndroid ? concat(rotateX, "deg") : rotateX},
   ]

    const outerTransform = [
      {perspective: this.perspective},
      {translateX},
      {scaleX: scaleXY},
      {scaleY: scaleXY},
    ]

    const outerStyle = {
      zIndex,
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
      width: size / 4,
      height: size,
      transform: outerTransform,
    }

    const color = `rgba(${colorIndex * colorMultiplier}, ${Math.abs(128 - colorIndex * colorMultiplier)}, ${255 - (colorIndex * colorMultiplier)}, 0.9)`

    const innerStyle = {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
      width: size / 4,
      height: size,
      backgroundColor: color,
      borderRadius: 10,
      zIndex,
      transform: innerTransform
    }

    const runCode = () => cond(and(clockRunning(cardClock), cardState.finished), [
      stopClock(cardClock),
      set(cardState.position, 1),
      procs.reset4(cardState.finished, cardState.time, cardState.velocity, cardTransY)
    ])

    return {
      handlerRef: React.createRef(),
      onHandlerStateChange,
      onGestureEvent,
      innerTransform,
      outerTransform,
      outerStyle, 
      innerStyle,
      runCode,
    }
  })

  renderCard = ({ handlerRef, onHandlerStateChange, onGestureEvent, outerStyle, innerStyle, runCode }, i) => {
    // @NOTE: PanGestureHandler should not directly wrap an element that can rotate completely on edge.
    // this causes values to go to infinity.
    return (
      <PanGestureHandler
        key={`card-${i}`}
        ref={handlerRef}
        simultaneousHandlers={this.mainHandler}
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
      >
        <Animated.View style={outerStyle}>
          <Animated.View
            style={innerStyle}
          />
          <Animated.Code>
            {runCode}
          </Animated.Code>
        </Animated.View>
      </PanGestureHandler>
    )
  }

  componentDidMount() {
    this.willBlurSub = this.props.navigation.addListener('blur', () => {
      this._mounted.setValue(0)
    })
  }

  componentWillUnmount() {
    this.willBlurSub?.remove?.()
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
        <Animated.Code>
          {() => block([
            onChange(this.leanAmt, set(this._prevLeanAmt, this.leanAmt)),
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
                  procs.reset4(this.animState.time, this.animState.position, this.animState.frameTime, this.animState.finished),
                ]),
            ]),
            cond(clockRunning(this.altClock), [
              spring(this.altClock, this.altState, this.altConfig),
              cond(and(eq(this.altState.finished, 1), clockRunning(this.altClock)), [
                stopClock(this.altClock),
                procs.reset4(this.altState.time, this.altState.velocity, this.altState.finished, this.altState.position),
              ]),
            ])
          ])}
        </Animated.Code>
      </View>
    )
  }
}

export default Carousel
