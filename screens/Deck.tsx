import React, { Component } from 'react'
import { View, Dimensions, SafeAreaView } from 'react-native'
import Animated, { defined, EasingNode as Easing,
  and,
  set,
  neq,
  cond,
  eq,
  add,
  block,
  startClock,
  stopClock,
  clockRunning,
  Value,
  Clock,
  event,
  interpolateNode as interpolate,
} from 'react-native-reanimated';
import { PanGestureHandler, PanGestureHandlerGestureEvent, PanGestureHandlerStateChangeEvent, State, TapGestureHandler, TapGestureHandlerStateChangeEvent } from 'react-native-gesture-handler';
import BackButton from '../components/BackButton'
import spring from '../procs/springFill'
import timingFill from '../procs/timingFill'
import procs from '../procs/deck'
const { width, height } = Dimensions.get('window');
const { inOut: timing } = timingFill

const numCards = 7

type Card = {
  style: any
  size: number
  runCode: () => Animated.Node<number>
  onHandlerStateChange: (evt: TapGestureHandlerStateChangeEvent) => void
}

class Deck extends Component {
  mainHandler: React.RefObject<PanGestureHandler>
  sprConfig: Animated.SpringConfig 
  sprState: Animated.SpringState
  translationY: Animated.Value<number>
  prevTrans: Animated.Value<number>
  gestureState: Animated.Value<State>
  perspective: Animated.Value<number>
  clock: Animated.Clock
  left: Animated.Value<number>
  velocity: Animated.Value<number>
  clockTrans: Animated.Node<number>
  cumulativeTrans: Animated.Node<number>
  cards: Card[]
  ry: Animated.Node<number>
  onPanStateChange: (evt: PanGestureHandlerStateChangeEvent) => void
  onPanGestureEvent: (evt: PanGestureHandlerGestureEvent) => void

  constructor(props) {
    super(props)
    this.mainHandler = React.createRef<PanGestureHandler>()
    this.translationY = new Value<number>(0)
    this.prevTrans = new Value<number>(0)
    this.gestureState = new Value(State.UNDETERMINED)
    this.perspective = new Value<number>(850)
    this.clock = new Clock()
    this.left = new Value<number>(0)
    this.velocity = new Value<number>(0)
  
  
    this.sprState = {
      finished: new Value(0),
      velocity: new Value(0),
      position: new Value(0),
      time: new Value(0),
    }
    this.sprConfig= {
      damping: 20,
      mass: 0.3,
      stiffness: 70,
      overshootClamping: false,
      toValue: new Value(0),
      restSpeedThreshold: 0.05,
      restDisplacementThreshold: 0.05,
    }
  
    this.clockTrans = cond(clockRunning(this.clock), this.sprState.position, 0)
    this.cumulativeTrans = add(this.translationY, this.prevTrans, this.clockTrans)
  
    this.ry = interpolate(this.cumulativeTrans, {
      inputRange: [0, height],
      outputRange: [0, 1],
    })
  
    this.cards = [...Array(numCards)].fill(0).map((_d, i, arr) => {
      const clock = new Clock()
      const config = {
        toValue: new Value(1),
        duration: 250,
        easing: Easing.inOut(Easing.ease),
      }
      const state = {
        position: new Value(0),
        finished: new Value(0),
        time: new Value(0),
        frameTime: new Value(0),
      }
  
      const colorIndex = i
      const colorMultiplier = 255 / (arr.length - 1)
      const size = width * 0.75
      const gestureState = new Value(State.UNDETERMINED)
      const midpoint = (arr.length - 1) / 2
  
      // 0: 10
      // 1: 5
      // 2: 0
      // 3: 5
      // 4: 10
      // midpoint: 2
      //
  
      const distFromMid = midpoint - i
      const ratio = distFromMid / midpoint
      const multiplier = ratio
      const maxY = multiplier * (height / 5)
      const scaleMultiplier = 1 - (i * (1 / arr.length))
  
      const iy = interpolate(this.ry, {
        inputRange: [-0.5, 0, 0.5],
        outputRange: [-maxY, i * 5, maxY],
      })
  
      const xOffset = width / 4
      const ix = procs.getXInput(this.ry, ratio, xOffset)
  
      const rotateZ = interpolate(this.ry, {
        inputRange: [0, 1],
        outputRange: [0, multiplier * Math.PI / 2],
      })
  
      const scale = interpolate(this.ry, {
        inputRange: [-0.5, 0, 0.5],
        outputRange: [1, 1 + scaleMultiplier * 0.1, 1],
      })
  
      const ic = interpolate(state.position, {
        inputRange: [0, 0.5, 1],
        outputRange: [0, 0.1, 0],
      })
  
      const color = `rgba(${colorIndex * colorMultiplier}, ${Math.abs(128 - colorIndex * colorMultiplier)}, ${255 - (colorIndex * colorMultiplier)}, 0.9)`
      const scaleXY = add(scale, ic)

      const style = {
        width: size,
        height: size / 2,
        justifyContent: 'center',
        position: 'absolute',
        alignItems: "center",
        backgroundColor: color,
        borderRadius: 10,
        zIndex: -i,
        opacity: 0.8,
        transform: [
          {translateY: iy},
          {translateX: procs.getDirectionalVal(this.left, ix)},
          {rotateZ: procs.getDirectionalVal(this.left, rotateZ)},
          {scaleX: scaleXY},
          {scaleY: scaleXY},
        ]
      }
  
      const runCode = () => cond(and(defined(this.clock), clockRunning(clock)), [
        timing(clock, state, config),
        cond(state.finished, [
          stopClock(clock),
          procs.reset4(state.position, state.frameTime, state.time, state.finished),
        ]),
      ])
  
      const onHandlerStateChange = event([{
        nativeEvent: ({ state }) => block([
          cond(and(defined(this.clock), eq(state, State.END), neq(gestureState, State.END)), [
            startClock(clock),
          ]),
          set(gestureState, state),
        ])
      }])
  
      return {
        size,
        style,
        runCode,
        onHandlerStateChange
      }
    })

    this.onPanGestureEvent = event([{
      nativeEvent: ({ translationY: y, velocityY }) => block([
        cond(eq(this.gestureState, State.ACTIVE), [
          set(this.translationY, y),
          set(this.velocity, velocityY),
        ])
      ])
    }])
  
    this.onPanStateChange = event([{
      nativeEvent: ({ state, x }) => block([
        procs.onPanActive(state, this.gestureState, this.cumulativeTrans, width, x, this.left),
        cond(
          and(
            defined(this.clock),
            eq(this.gestureState, State.ACTIVE),
            neq(state, State.ACTIVE),
          ), [
          procs.onPanEnd(
            this.prevTrans,
            this.translationY,
            this.sprState.position,
            this.sprConfig.toValue,
            height,
          ),
          startClock(this.clock),
        ]),
        cond(and(defined(this.clock),eq(state, State.ACTIVE), clockRunning(this.clock)), [
          stopClock(this.clock),
          set(this.prevTrans, add(this.prevTrans, this.sprState.position)),
          procs.reset4(this.sprState.position, this.sprState.time, this.sprState.velocity, this.sprState.finished),
        ]),
  
        set(this.gestureState, state),
      ])
    }]
    )

  }

  renderCard = ({
    size,
    style,
    runCode,
    onHandlerStateChange,
  }, i) => {

    return (
      <Animated.View
        key={`card-${i}`}
        style={style}
      >
        <TapGestureHandler onHandlerStateChange={onHandlerStateChange}>
          <Animated.View style={{
            flex: 1,
            width: size,
            alignItems: 'flex-end',
            justifyContent: 'flex-end',
            padding: 10
          }} />
        </TapGestureHandler>
        <Animated.Code>
          {runCode}
        </Animated.Code>
      </Animated.View>
    )
  }




  render() {
    return (
      <View style={{
        flex: 1,
        backgroundColor: 'seashell',
      }}>
        <SafeAreaView style={{ flex: 1 }}>

          <PanGestureHandler
            ref={this.mainHandler}
            onGestureEvent={this.onPanGestureEvent}
            onHandlerStateChange={this.onPanStateChange}
          >
            <Animated.View style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {this.cards.map(this.renderCard)}
            </Animated.View>
          </PanGestureHandler>
        </SafeAreaView>
        <BackButton />
        <Animated.Code>
          {() => cond(and(defined(this.clock), clockRunning(this.clock)), [
            spring(this.clock, this.sprState, this.sprConfig),
            cond(this.sprState.finished, [
              procs.resetSpring(this.sprState.time, this.sprState.position, this.sprState.finished, this.sprState.velocity, this.sprConfig.toValue, this.prevTrans),
              stopClock(this.clock),
            ])
          ])}
        </Animated.Code>
      </View>

    )
  }
}

export default Deck