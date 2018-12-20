import React, { Component } from 'react';
import { Dimensions, Image, Text, View, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import Animated, { Easing } from 'react-native-reanimated';
import { PanGestureHandler, State, TapGestureHandler } from 'react-native-gesture-handler';

import BackButton from '../components/BackButton'
import { startClockIfStopped } from '../utils';

const { width, height } = Dimensions.get('window');

const numPetals = Math.floor(Math.random() * 6) + 10
const petals = [...Array(numPetals)].fill(0)
const petalSize = 50
const multiplier = 60
const flowerSize = 80;
const stemHeight = height / 2
const stemWidth = 10
const stemPos = width - (width / 3)


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
} = Animated;


class Flower extends Component {

  state = {
    petals: []
  }

  reset = () => {

    const touchActive = p => or(eq(p.gestureState, State.ACTIVE), eq(p.gestureState, State.BEGAN))

    let petalsConfig = petals.map((d, i, arr) => {
      const ratio = i / arr.length
      const val = Math.PI * 2 * ratio
      const startX = Math.sin(val) * multiplier
      const startY = Math.cos(val) * multiplier
      const rotation = - Math.PI / 4 - (ratio * Math.PI * 2)
      const x = new Value(0)
      const y = new Value(0)
      return {
        clock: new Clock(),
        state: {
          finished: new Value(0),
          position: new Value(0),
          frameTime: new Value(0),
          time: new Value(0),
        },
        config: {
          toValue: 1,
          duration: 5000,
          easing: Easing.inOut(Easing.ease),
        },
        driftConfig: {
          direction: Math.random() > 0.5 ? 1 : -1,
          width: Math.random() * (width / 10) + (width / 8),
          period: Math.random() * 6 + 5,
          rotationMultiplier: (Math.random() * 4 + 1) * (Math.random() < 0.5 ? -1 : 1),
        },
        x,
        y,
        _x: x,
        _y: y,
        startX: new Value(startX),
        startY: new Value(startY),
        gestureState: new Value(-1),
        rotate: new Value(rotation),
        color: `rgb(240, ${Math.random() * 100}, ${Math.random() * 100})`
      }
    })

    petalsConfig = petalsConfig.map((p, i) => {
      return {
        ...p,
        onGestureEvent: event([
          {
            nativeEvent: {
              translationX: petalsConfig[i].x,
              translationY: petalsConfig[i].y,
              state: petalsConfig[i].gestureState,
            },
          },
        ]),
      }
    })
    
    const states = ['UNDETERMINED', 'FAILED', 'BEGAN', 'CANCELLED', 'ACTIVE', "END"]

    const followTouch = (p, xy) => [
      add(p[xy], p[`start${xy.toUpperCase()}`])
    ]
    const hasMoved = (p) => or(neq(p.x, 0), neq(p.y, 0))
    
    const reset = ({ clock, state }) => [
      stopClock(clock),
      set(state.finished, 0),
      set(state.position, 0),
      set(state.frameTime, 0),
      set(state.time, 0)
    ]

    const stopClockIfFinished = (state, clock) => cond(state.finished, cond(clockRunning(clock), stopClock(clock)))

    const calcX = p => {
      const follow = followTouch(p, 'x')
      return (
        cond(touchActive(p), follow, [
            cond(hasMoved(p), cond(not(clockRunning(p.clock)), [
              reset(p),
              startClock(p.clock)
            ])),
            cond(and(hasMoved(p), clockRunning(p.clock)), [
              timing(p.clock, p.state, p.config),
              stopClockIfFinished(p.state, p.clock),
              add(follow,
                multiply(
                  p.driftConfig.width,
                  sin(multiply(p.state.position, p.driftConfig.period)),
                  p.driftConfig.direction,
                )
              ),
            ], [
              follow
            ]
            )
          ])
      )
    }

    const calcY = p => {
      const follow = followTouch(p, 'y')
      return (
        cond(touchActive(p), follow, [
          cond(hasMoved(p), [
            add(follow, multiply(height * 1.1, p.state.position)),
          ], follow)
        ])
      )
    }

    const rot = p => {
      return (
        cond(and(not(touchActive(p)), hasMoved(p)), [
          add(multiply(p.state.position, p.driftConfig.rotationMultiplier), p.rotate),
        ], p.rotate)
      )
    }


    petalsConfig = petalsConfig.map((p, i) => {
      return {
        ...p,
        x: calcX(p),
        y: calcY(p),
        rotate: rot(p),
      }
    })
    return petalsConfig
  }

  constructor(props) {
    super(props);

    const p = this.reset()
    this.state = {
      petals: p,
    }
  }

  renderPetal = (d, i) => {
    const petal = this.state.petals[i]
    return (
      <Animated.View
        key={`petal-${i}`}
        style={{
          width: petalSize,
          height: petalSize,
          zIndex: 999 - i,
          transform: [
            { translateX: add(stemPos - flowerSize / 2 + 12, petal.x) },
            { translateY: add(height - stemHeight - flowerSize / 2 - petalSize / 2, sub(petal.y, i * petalSize)) }
          ]
        }}>
        <PanGestureHandler
          onGestureEvent={petal.onGestureEvent}
          onHandlerStateChange={petal.onGestureEvent}
        >
          <Animated.View style={{
            width: petalSize,
            height: petalSize,
          }}>
            <Animated.View
              style={[styles.petal, {
                flex: 1,
                backgroundColor: petal.color,
                transform: [
                  { rotate: petal.rotate }
                ]
              }]} />
          </Animated.View>
        </PanGestureHandler>
      </Animated.View>
    )
  }

  renderSun = () => (
    <Animated.View
      style={{
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'orange',
        transform: [
          {
            translateX: -100,
            translateY: -100,
          }
        ]
      }}
    />
  )

  renderGrass = () => (
    <Animated.View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: height / 20,
        backgroundColor: 'darkgreen',
      }}
    />
  )

  renderStem = () => (
    <Animated.View
      style={{
        position: 'absolute',
        bottom: 0,
        width: stemWidth,
        height: stemHeight,
        backgroundColor: 'green',
        left: stemPos,
      }}
    />
  )

  renderFlowerMiddle = () => {
    return (
      <TouchableOpacity
        onPress={
          () => {
            this.state.petals.forEach((p, i, arr) => {
                const midpoint = arr.length / 2
                const distFromMid = Math.abs(midpoint - i)
                setTimeout(() => p._x.setValue(1), distFromMid * 300 + 100)
            })
          }
      }

        style={[
          styles.box,
          {
            backgroundColor: 'gold',
            bottom: stemHeight,
            left: stemPos - flowerSize / 2,
          },
        ]}
      />
    )
  }

  renderMessage = () => (
    <View style={{ position: 'absolute', width, height: 80, top: 30, left: 50 }}>
      <Text style={{ fontSize: 50, fontWeight: 'bold', color: 'white' }}>{`HI ALISHA 😍`}</Text>
    </View>
  )

  render() {
    return (
      <View style={styles.container}>
        <Animated.View style={{ opacity: this.d }} />
        <StatusBar hidden />
        {this.renderSun()}
        {this.renderStem()}
        {this.renderGrass()}
        {this.renderFlowerMiddle()}
        {petals.map(this.renderPetal)}
        <BackButton onPress={() => this.props.navigation.goBack(null)} />
      </View>
    );
  }
}

export default Flower

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'lightskyblue',
    overflow: 'hidden', 
  },
  box: {
    position: 'absolute',
    width: flowerSize,
    height: flowerSize,
    borderColor: '#F5FCFF',
    borderRadius: flowerSize / 2,
  },
  petal: {
    position: 'absolute',
    width: petalSize,
    height: petalSize,
    borderRadius: petalSize / 2,
    borderColor: 'salmon',
    borderWidth: 2,
    borderBottomLeftRadius: 0,
  }
});