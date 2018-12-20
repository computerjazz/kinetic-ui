import React, { Component } from 'react'
import { View, StyleSheet, Dimensions, StatusBar } from 'react-native'
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated, { Easing } from 'react-native-reanimated'

import { isActive, followTouch, hasMoved, startClockIfStopped } from '../utils'

const { width, height } = Dimensions.get('window')
const {
  interpolate,
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
} = Animated;

import BackButton from '../components/BackButton'

const stars = [...Array(144)].fill(0).map((d, i) => ({
  left: Math.random() * width,
  top: Math.random() * height,
  size: Math.random() + 2,
}))

const lanterns = [...Array(4)].fill(0)

class Lanterns extends Component {

  lanterns = []

  constructor(props) {
    super(props)
    this.lanterns = lanterns.map((lantern, i) => {
      return {
        clock: new Clock(),
        state: {
          finished: new Value(0),
          velocity: new Value(0),
          position: new Value(1),
          time: new Value(0),
        },
        config: {
          damping: 8,
          mass: 0.3,
          stiffness: 188.296,
          overshootClamping: false,
          toValue: 0,
          restSpeedThreshold: 0.001,
          restDisplacementThreshold: 0.001,
        },
        flameConfig: {
          clock: new Clock(),
          config: {
            toValue: 1,
            duration: Math.random() * 3000 + 200,
            easing: Easing.inOut(Easing.ease),
          },
          state: {
            finished: new Value(0),
            position: new Value(0),
            frameTime: new Value(0),
            time: new Value(0),
          },
          width: Math.random() + 1,
        },
        x: new Value(0),
        y: new Value(0),
        startX: new Value(0),
        startY: new Value(0),
        gestureState: new Value(-1),
      }
    })

    this.lanterns = this.lanterns.map((lantern, i) => {
      return {
        ...lantern,
        onGestureEvent: event([
          {
            nativeEvent: {
              translationX: lantern.x,
              translationY: lantern.y,
              state: lantern.gestureState,
            },
          }
        ]),
      }
    })

   const bounceX = (l, xy) => cond(isActive(l), followTouch(l, xy),
      cond(and(hasMoved(l), not(l.state.finished)), [
        startClockIfStopped(l.clock),
        spring(l.clock, l.state, l.config),
        cond(l.state.finished, [
          stopClock(l.clock),
          set(l.state.position, 1),
          set(l.state.finished, 0),
          set(l.x, 0),
          set(l.y, 0)
        ], multiply(l[xy], l.state.position))
      ]))

    const bounceY = (l, xy) => cond(
      isActive(l), 
      followTouch(l, xy),
      cond(and(hasMoved(l), not(l.state.finished)), multiply(l[xy], l.state.position)))

    const flicker = ({ clock, state, config, width }) => cond(
      eq(state.position, 1),
      [ 
        set(state.finished, 0),
        set(state.time, 0),
        set(state.frameTime, 0),
        set(state.position, 0),
        1,
      ],
      [
        cond(clockRunning(clock), 0, startClock(clock)),
        timing(clock, state, config),
        interpolate(state.position, {
          inputRange: [0, 0.5, 1],
          outputRange: [1, width, 1],
        }),
      ]
    )

    this.lanterns = this.lanterns.map((l, i) => {
      return {
        ...l,
        flameAnim: flicker(l.flameConfig),
        x: bounceX(l, 'x'),
        y: bounceY(l, 'y')

      }
    })
  }

  renderStar = (star, i) => {
    const { left, top, size } = star
    return <View key={`star-${i}`} style={{
      position: 'absolute',
      backgroundColor: '#e7e8a9',
      left, top, width: size, height: size, borderRadius: size
    }} />
  }

  renderLantern = (lantern, i, arr) => {
    const ratio = i / (arr.length - 1)
    const maxSag = 20
    const sag = Math.sin(Math.PI * ratio) * maxSag
    console.log('sag', sag, ratio)
    return (
      <Animated.View 
      key={`lantern-${i}`}
      style={{
        paddingTop: sag,
        transform: [{
            translateX: lantern.x,
            translateY: lantern.y,
          }]
      }}
      >
      <PanGestureHandler
          onGestureEvent={lantern.onGestureEvent}
          onHandlerStateChange={lantern.onGestureEvent}
      >
      <Animated.View>
        <Animated.View style={styles.lanternOuter}>
          <View style={styles.lanternInner} />
          <Animated.View style={[styles.lanternFlame, {
            transform: [{
              scaleY: 5,
              translateY: 6,
              scaleX: lantern.flameAnim,
            }]
          }]} />
        </Animated.View>
        </Animated.View>
      </PanGestureHandler>
      </Animated.View>
    )
  }

  renderLanternString = () => {
    const h = 75
    return <View style={{
      position: 'absolute',
      width: h,
      height: h,
      transform: [{ translateY: -h / 2}, { scaleX: 9 }, { translateX: 15}],
      borderColor: '#444',
      borderWidth: 3,
      borderRadius: h,
    }} />
  }

  render() {
    return (
      <View style={styles.container}>
        <StatusBar hidden />

        {stars.map(this.renderStar)}
        {this.renderLanternString()}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          paddingTop: 50,
        }}>
          {this.lanterns.map(this.renderLantern)}
        </View>
        <BackButton onPress={() => this.props.navigation.goBack(null)} />
      </View>
    )
  }
}

export default Lanterns

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#011c47',
    overflow: 'hidden',
  },
  lanternOuter: {
    width: 75,
    height: 75,
    borderRadius: 75,
    backgroundColor: '#f44242',
    alignItems: 'center',
    transform: [{ scaleY: 0.75 }]
  },
  lanternInner: {
    width: 30,
    height: 30,
    position: 'absolute',
    borderRadius: 30,
    backgroundColor: '#f4c741',
    transform: [{ scaleY: 0.75 }]
  },
  lanternFlame: {
    width: 10,
    height: 10,
    opacity: 0.5,
    position: 'absolute',
    borderRadius: 30,
    backgroundColor: '#f4c741',
   
  }
})