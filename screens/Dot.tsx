import React, { Component } from 'react';
import { Dimensions, Image, Text, View, StyleSheet, TouchableOpacity, StatusBar, Platform } from 'react-native';
import Animated, { Easing } from 'react-native-reanimated';
import { PanGestureHandler, State, TapGestureHandler } from 'react-native-gesture-handler';
import { throttle } from 'lodash'

import BackButton from '../components/BackButton'

const { width, height } = Dimensions.get("window")

const dotSize = 80
const additionalScale = 0.5
const fxScales = {
  in: 2,
  out: 15,
}

const duration = {
  active: 500,
  inactive: 1000,
}

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
  cos,
  round,
  abs,
  color,
  call,
} = Animated;


class Dot extends Component {

  constructor(props) {
    super(props);

    const rotClock = new Clock()

    const rotState = {
      position: new Value(0),
      time: new Value(0),
      frameTime: new Value(0),
      finished: new Value(0),
    }
    const rotConfig = {
      easing: Easing.linear,
      toValue: Math.PI * 2,
      duration: 20000,
    }


    this.centerRotate = block([
      cond(not(clockRunning(rotClock)), startClock(rotClock)),
      timing(rotClock, rotState, rotConfig),
      cond(rotState.finished, [
        stopClock(rotClock),
        set(rotState.position, 0),
        set(rotState.time, 0),
        set(rotState.frameTime, 0),
        set(rotState.finished, 0),
        startClock(rotClock),
      ]),
      rotState.position,
    ])

    const scaleClock = new Clock()

    const scaleState = {
      position: new Value(0),
      time: new Value(0),
      frameTime: new Value(0),
      finished: new Value(0),
    }
    this.scaleConfig = {
      easing: Easing.linear,
      toValue: Math.PI * 2,
      duration: new Value(1000),
    }

    this.scaleVal = new Value(0.05)
    const runScale = block([
      cond(not(clockRunning(scaleClock)), startClock(scaleClock)),
      timing(scaleClock, scaleState, this.scaleConfig),
      cond(scaleState.finished, [
        stopClock(scaleClock),
        set(scaleState.position, 0),
        set(scaleState.time, 0),
        set(scaleState.frameTime, 0),
        set(scaleState.finished, 0),
        startClock(scaleClock),
      ]),
      scaleState.position,
    ])

    this.centerScale = add(1, multiply(this.scaleVal, sin(runScale)))


    const numDots = 7
    this.radius = width / 3
    const dotCenterX = width / 2 - dotSize / 2
    const dotCenterY = height / 2 - dotSize / 2

    this.dots = [...Array(numDots)].fill(0).map((d, index, arr) => {
      const colorMultiplier = 255 / (arr.length - 1)

      const clock = new Clock();

      const dragX = new Value(0);
      const dragY = new Value(0);
      const ratio = index / arr.length

      const startX = new Value(dotCenterX + Math.sin(ratio * Math.PI * 2) * this.radius)
      const startY = new Value(dotCenterY + Math.cos(ratio * Math.PI * 2) * this.radius)
      
      const prevX = new Value(0);
      const prevY = new Value(0);

      const dotScaleState = {
        finished: new Value(0),
        velocity: new Value(0),
        position: new Value(0),
        time: new Value(0),
      };

      const dotScaleConfig = {
        damping: 22,
        mass: 1,
        stiffness: 550,
        overshootClamping: false,
        restSpeedThreshold: 0.001,
        restDisplacementThreshold: 0.001,
        toValue: new Value(1),
      };

      const c = multiply(index, colorMultiplier)
      const r = round(c)
      const g = round(abs(sub(128, c)))
      const b = round(sub(255, c))
      const dotColor = color(r, g, b)

      const runClock = [
        cond(clockRunning(clock), [
          spring(clock, dotScaleState, dotScaleConfig),
          cond(dotScaleState.finished, [
            set(dotScaleState.finished, 0),
            set(dotScaleState.velocity, 0),
            // set(dotScaleState.position, 0),
            set(dotScaleState.time, 0),
          ])
        ]),
        dotScaleState.position
      ]

      const x = {
        start: startX,
        prev: prevX,
        drag: dragX,
        translate: add(startX, multiply(runClock, add(dragX, prevX)))
      }

      const y = {
        start: startY,
        prev: prevY,
        drag: dragY,
        translate: add(startY, multiply(runClock, add(dragY, prevY)))
      }

      return {
        gestureState: new Value(State.UNDETERMINED),
        zIndex: new Value(0),
        x,
        y,
        scale: add(multiply(runClock, additionalScale), 1),
        dotScaleState,
        dotScaleConfig,
        clock,
        dotColor,
      }
    })

    this.state = {
      color: 'transparent',
    }
  }

  onDragBegin = ([ dragX, dragY, color]) => {}

  onDrag = ([dragX, dragY, color]) => {
    this.setState({ color })
   this.checkIntersection({
     x: dragX,
     y: dragY,
     onIntersectIn: () => this.onIntersectIn(color),
     onIntersectOut: () => this.onIntersectOut(),
   })
  }

  onDragEnd = () => {
    if (this.intersects) {
      // Animate color expansion
      this.animateFx(fxScales.out)
    }  else {
      this.onIntersectOut()
    }
  }

  onIntersectIn = (color) => {
    this.setState({ color }, () => {
      this.animateFx(fxScales.in)
    })
  }

  onIntersectOut = () => {
    this.animateFx(fxScales.out, () => this.setState({ color: 'transparent '}))
  }

  animateFx = (toValue, cb) => {
    this.fxConfig.toValue = toValue
    this.fxAnim = spring(this.scaleFx, this.fxConfig)
    this.fxAnim.start(() => {
      cb && cb()
    })
  }

  renderDot = ({ 
    dotColor,
    gestureState, 
    x,
    y,
    clock, 
    scale, 
    dotScaleConfig,
    zIndex,
  }, i) => {

    return (
      <PanGestureHandler
        key={`dot-${i}`}
        onGestureEvent={event([{
          nativeEvent: ({ translationX, translationY, state }) => block([
            cond(eq(gestureState, State.ACTIVE), [
              set(x.drag, translationX),
              set(y.drag, translationY),
              call([x.translate, y.translate, dotColor], throttle(([dragX, dragY, c]) => this.onDrag([dragX, dragY, dotColor]), 100, { trailing: false }))
            ])
          ]),
        }])}
        onHandlerStateChange={event([{
          nativeEvent: ({ state }) => block([
            // Dot becoming active
            cond(
              and(
                neq(gestureState, State.ACTIVE),
                eq(state, State.ACTIVE),
              ), [
                set(zIndex, 999),
                set(dotScaleConfig.toValue, 1),
                call([x.translate, y.translate, dotColor], this.onDragBegin),
                startClock(clock),
              ]
            ),
            // Dot becoming inactive
            cond(
              and(
                eq(gestureState, State.ACTIVE),
                neq(state, State.ACTIVE),
              ), [
                set(zIndex, 0),
                set(dotScaleConfig.toValue, 0),
                call([x.translate, y.translate, dotColor], this.onDragEnd),
                startClock(clock),
              ]),
            set(gestureState, state),
          ])
        }])}
      >

        <Animated.View
          style={{
            flex: 1,
            position: 'absolute',
            width: dotSize,
            height: dotSize,
            zIndex,
            transform: [{
              translateX: x.translate,
              translateY: y.translate,
            }]
          }}
        >
          <Animated.View
            style={{
              position: 'absolute',
              opacity: 0.85,
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: dotColor,
              transform: [{
                scaleX: scale,
                scaleY: scale,
              }]
            }}
          />
        </Animated.View>
      </PanGestureHandler>
    )
  }

  intersects = false
  checkIntersection = async ({x, y, onIntersectIn, onIntersectOut }) => {
    let intersects = false
    const dotRadius = dotSize * (1 + additionalScale)
    const dotCenter = {
      x: x + dotRadius / 2,
      y: y + dotRadius / 2,
    }
    const xl = width / 2 - this.radius / 2
    const xr = xl + this.radius
    const yt = height / 2 - this.radius / 2
    const yb = yt + this.radius
    intersects = (dotCenter.x > xl) && (dotCenter.x < xr) && (dotCenter.y > yt) && (dotCenter.y < yb)

    if (intersects && !this.intersects) onIntersectIn()
    else if (!intersects && this.intersects) onIntersectOut()
    
    this.intersects = intersects
    return intersects
  }

  scaleFx = new Value(fxScales.out)
  fxConfig = {
    damping: 22,
    mass: 1,
    stiffness: 55,
    overshootClamping: false,
    restSpeedThreshold: 0.001,
    restDisplacementThreshold: 0.001,
    toValue: fxScales.in,
  }
  fxAnim = spring(this.scaleFx, this.fxConfig)

  render() {
    const translateX = width / 2 - this.radius / 2
    const translateY = height / 2 - this.radius / 2

    return (
      <Animated.View style={[
        styles.container,
      ]}>
        <Animated.View
          style={{
            position: 'absolute',
            opacity: 0.85,
            width: this.radius,
            height: this.radius,
            borderRadius: this.radius,
            borderColor: this.state.color,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 20,
            transform: [{
              translateX,
              translateY,
              scaleX: this.scaleFx,
              scaleY: this.scaleFx,
            }]
          }}
        />

      <Animated.View
        style={{
          position: 'absolute',
          width: this.radius,
          height: this.radius,
          borderRadius: this.radius,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 5,
          borderStyle: 'dotted',
          backgroundColor: 'seashell',
          borderColor: '#ccc',
          transform: [{
            translateX,
            translateY,
            rotate: this.centerRotate,
            scaleX: this.centerScale,
            scaleY: this.centerScale,
          }]
        }}
      >
        <Text 
          style={{ 
            color: 'seashell', 
            fontSize: 18, 
            fontWeight: 'bold'
            }}>{}</Text>
      </Animated.View>
        {this.dots.map(this.renderDot)}
        <BackButton onPress={() => this.props.navigation.goBack(null)} />
      </Animated.View>
    )
  }
}

export default Dot

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'seashell',
    overflow: 'hidden',
  },
});