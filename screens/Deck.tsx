import React, { Component } from 'react'
import { View, Dimensions, Text, Platform } from 'react-native'
import Animated, { Easing } from 'react-native-reanimated';
import { PanGestureHandler, State, TapGestureHandler } from 'react-native-gesture-handler';
import BackButton from '../components/BackButton'


const { width, height } = Dimensions.get('window');
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
const tickHeight = height * 0.75
const flingThresh = 500

class Deck extends Component {

  constructor() {
    super()
    this.mainHandler = React.createRef()
    this.translationY = new Value(0)
    this.prevTrans = new Value(0)
    this.gestureState = new Value(State.UNDETERMINED)
    this.perspective = new Value(850)
    this.clock = new Clock()
    this._mounted = new Value(1)
    this.left = new Value(0)


    this.sprState = {
      finished: new Value(0),
      velocity: new Value(0),
      position: new Value(0),
      time: new Value(0),
    }

      this.sprConfig = {
        damping: 20,
        mass: 0.3,
        stiffness: 70,
        overshootClamping: false,
        toValue: new Value(0),
        restSpeedThreshold: 0.05,
        restDisplacementThreshold: 0.05,
      }

    const resetSpring = [
      set(this.sprState.time, 0),
      set(this.sprState.position, this.sprConfig.toValue),
      set(this.sprState.finished, 0),
      set(this.sprState.velocity, 0),
      set(this.prevTrans, this.sprConfig.toValue),
    ]

    const runClock = cond(clockRunning(this.clock), [
      spring(this.clock, this.sprState, this.sprConfig),
      cond(eq(this.sprState.finished, 1), [
        resetSpring,
        stopClock(this.clock),
      ]),
      this.sprState.position
    ])

    this.cumulativeTrans = add(this.translationY, this.prevTrans, runClock)
    const ry = Animated.interpolate(this.cumulativeTrans, {
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
      const scaleMultiplier = 1- (i * (1 / arr.length))


      const iy = Animated.interpolate(ry, {
        inputRange: [-0.5 ,0, 0.5],
        outputRange: [-maxY, i*5, maxY],
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
        translateX: cond(this.left, multiply(ix, -1), ix),
        size,
        index: colorIndex,
        gestureState,
        rotateZ: cond(this.left, multiply(rotateZ, -1), rotateZ),
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
      <TapGestureHandler
         onHandlerStateChange={event([{
           nativeEvent: ({ state }) => block([

             cond(and(greaterThan(abs(this.cumulativeTrans), 50), eq(state, State.BEGAN), neq(gestureState, State.BEGAN)), [
               debug('began', gestureState),
             ]),
             cond(and(eq(state, State.END), neq(gestureState, State.END)), [
               debug('end', gestureState),
               startClock(clock),
             ]),
             cond(and(eq(state, State.FAILED), neq(gestureState, State.FAILED)), [
               debug('fail', gestureState),
             ]),
             set(gestureState, state),

           ])
         }])}
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
          </TapGestureHandler>
      </Animated.View>
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
          onGestureEvent={event([{
            nativeEvent: ({ translationY: y, velocityY, state, x }) => block([

              cond(eq(this.gestureState, State.ACTIVE), [
                set(this.translationY, y),
                set(this.velocity, velocityY),
              ])
            ])
          }])}
          onHandlerStateChange={event([{
            nativeEvent: ({ state, velocityY, x }) => block([
              cond(
                and(
                  eq(state, State.ACTIVE),
                  neq(this.gestureState, State.ACTIVE),
                  lessThan(abs(this.cumulativeTrans), 10),
                ), [
                  set(this.left, cond(lessThan(x, width / 2), 1, 0)),
                  debug('left', this.left),
                  // debug('gestureState', this.gestureState),
                ]
              ),
              cond(
                and(
                  eq(this.gestureState, State.ACTIVE), 
                  neq(state, State.ACTIVE),
                ), [
                set(this.prevTrans, add(this.prevTrans, this.translationY)),
                set(this.translationY, 0),
                set(this.sprState.position, this.prevTrans),
                set(this.prevTrans, 0),
                cond(
                  greaterThan(abs(this.sprState.position), height / 4),
                   [
                  set(this.sprConfig.toValue, cond(greaterThan(this.sprState.position, 0), [height / 2], [-height / 2])),
                ], [
                  set(this.sprConfig.toValue, 0),
                ]),
                startClock(this.clock),
              ]),
              cond(and(eq(state, State.ACTIVE), clockRunning(this.clock)), [
                stopClock(this.clock),
                set(this.prevTrans, add(this.prevTrans, this.sprState.position)),
                set(this.sprState.position, 0),
                set(this.sprState.time, 0),
                set(this.sprState.velocity, 0),
                set(this.sprState.finished, 0),
              ]),

              set(this.gestureState, state),
            ])
          }]
          )}
        >

          <Animated.View style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {this.cards.map(this.renderCard)}
          </Animated.View>
        </PanGestureHandler>
        <BackButton color="#ddd" onPress={() => this.props.navigation.goBack(null)} />
      </View>

    )
  }
}

export default Deck