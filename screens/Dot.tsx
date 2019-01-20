import React, { Component } from 'react';
import { Dimensions, Image, Text, View, StyleSheet, TouchableOpacity, StatusBar, Platform } from 'react-native';
import Animated, { Easing } from 'react-native-reanimated';
import { PanGestureHandler, State, TapGestureHandler } from 'react-native-gesture-handler';
import { throttle } from 'lodash'

import BackButton from '../components/BackButton'

const { width, height } = Dimensions.get("window")

const dotSize = 80
const additionalScale = 0.5
const ringScales = {
  disabled: 0,
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



    // Center drop zone rotate/scale animation
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




    // Ring animation
    const ringR = new Value(0)
    const ringG = new Value(0)
    const ringB = new Value(0)
    const ringA = new Value(1)

    this.ring = {
      r: ringR,
      g: ringG,
      b: ringB,
      a: ringA,
      color: color(ringR, ringG, ringB, ringA),
      rgb: {
        r: ringR,
        g: ringG,
        b: ringB,
        a: ringA,
      },
    }

    this.ringClock = new Clock()
    this.ringColor = color()
    this.ringState = {
      position: new Value(0),
      time: new Value(0),
      finished: new Value(0),
      velocity: new Value(0),
    }
    this.ringConfig = {
      damping: 22,
      mass: 1,
      stiffness: 55,
      overshootClamping: false,
      restSpeedThreshold: 0.001,
      restDisplacementThreshold: 0.001,
      toValue: new Value(ringScales.in),
    }

    const resetRing = [
      set(this.ringState.position, ringScales.disabled),
      set(this.ringState.time, 0),
      set(this.ringState.finished, 0),
      set(this.ringState.velocity, 0)
    ]

    this.ringScale = block([
      cond(clockRunning(this.ringClock), [
        spring(this.ringClock, this.ringState, this.ringConfig),
        cond(this.ringState.finished, [
          stopClock(this.ringClock),
          set(this.ringState.time, 0),
          set(this.ringState.velocity, 0),
          set(this.ringState.finished, 0),
          // resetRing,
        ])
      ]),
      this.ringState.position,
    ])







    const numDots = 7
    this.radius = width / 3
    const dotCenterX = width / 2 - dotSize / 2
    const dotCenterY = height / 2 - dotSize / 2

    const placeholderR = new Value(0)
    const placeholderG = new Value(0)
    const placeholderB = new Value(0)
    const placeholderA = new Value(0)

    this.placeholderDot = {
        x: new Value(0),
        y: new Value(0),
        r: placeholderR,
        g: placeholderG,
        b: placeholderB,
        a: placeholderA,
        color: color(placeholderR, placeholderG, placeholderB, placeholderA),
        opacity: 1,
        scale: new Value(0),
    }

    this.dots = [...Array(numDots)].map((d, index, arr) => {
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
        restSpeedThreshold: 0.01,
        restDisplacementThreshold: 0.01,
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
            stopClock(clock),
            set(dotScaleState.finished, 0),
            set(dotScaleState.velocity, 0),
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

      const xl = width / 2 - this.radius / 2
      const xr = xl + this.radius
      const yt = height / 2 - this.radius / 2
      const yb = yt + this.radius
      const dotRadius = dotSize * (1 + additionalScale)
      const dotCenter = {
        x: add(x.translate, dotRadius / 2),
        y: add(y.translate, dotRadius / 2,)
      }


      const intersects = cond(
          and(
            greaterThan(dotCenter.x, xl),
            lessThan(dotCenter.x, xr),
            greaterThan(dotCenter.y, yt),
            lessThan(dotCenter.y, yb),
        ),1 , 0)
      

      const endClock = new Clock
      const endState = {
        position: new Value(0),
        finished: new Value(0),
        time: new Value(0),
        frameTime: new Value(0),
      }
      const endConfig = {
        easing: Easing.linear,
        duration: 1000,
        toValue: 1,
      }

      const runEndClock = [
        timing(endClock, endState, endConfig),
        cond(endState.finished, [
          stopClock(endClock),
          set(endState.finished, 0),
          set(endState.time, 0),
          set(endState.frameTime, 0),
        ]),
        endState.position,
      ]

      const scale = cond(
        clockRunning(endClock), [
          set(this.placeholderDot.scale, multiply(add(1, additionalScale), add(1, multiply(-1, runEndClock)))),
          runEndClock, 
          ], [
          cond(eq(endState.position, 1), set(endState.position, 0)),
          add(multiply(runClock, additionalScale), 1)
        ],
      )

      return {
        gestureState: new Value(State.UNDETERMINED),
        zIndex: new Value(0),
        intersects,
        x,
        y,
        scale,
        dotScaleState,
        dotScaleConfig,
        clock,
        endClock,
        dotColor,
        rgb: {r, g, b},
      }
    })
  }

  renderDot = ({ 
    dotColor,
    gestureState, 
    x,
    y,
    clock, 
    endClock,
    scale, 
    dotScaleConfig,
    zIndex,
    intersects,
    rgb,
  }, i) => {

    return (
      <PanGestureHandler
        key={`dot-${i}`}
        onGestureEvent={event([{
          nativeEvent: ({ translationX, translationY, state }) => block([
            cond(eq(gestureState, State.ACTIVE), [
              // Dot entering center
              cond(
                and(
                  intersects, 
                  not(clockRunning(this.ringClock)),
                  neq(this.ringState.position, ringScales.in),
                ), 
                [
                  debug('entering center', this.ringState.position),
                  set(this.ring.a, 1),
                  set(this.ringState.position, ringScales.disabled),
                  set(this.ringConfig.toValue, ringScales.in),
                  startClock(this.ringClock),
                ]
              ),
              // Dot leaving center
              cond(
                and(
                  not(intersects),
                  not(clockRunning(this.ringClock)),
                  neq(this.ringState.position, ringScales.disabled),
                ), [
                  debug('leaving center', this.ringState.position),
                  set(this.ringConfig.toValue, ringScales.disabled),
                  startClock(this.ringClock),
                ]
              ),
              set(x.drag, translationX),
              set(y.drag, translationY),
              cond(intersects, [
                set(this.placeholderDot.x, x.translate),
                set(this.placeholderDot.y, y.translate),
              ]),
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
                debug('becoming active', dotScaleConfig.toValue),
                set(this.ring.a, 0), // Hide ring spring back to center
                set(this.ring.r, rgb.r),
                set(this.ring.g, rgb.g),
                set(this.ring.b, rgb.b),
                set(this.placeholderDot.r, rgb.r),
                set(this.placeholderDot.g, rgb.g),
                set(this.placeholderDot.b, rgb.b),
                set(this.placeholderDot.a, 0),
                set(zIndex, 999),
                set(dotScaleConfig.toValue, 1),
                set(this.placeholderDot.scale, 0.5),
                startClock(clock),
              ]
            ),
            // Dot becoming inactive
            cond(
              and(
                eq(gestureState, State.ACTIVE),
                neq(state, State.ACTIVE),
              ), [
                debug('becoming inactive', dotScaleConfig.toValue),
                set(this.placeholderDot.a, 1),
                set(zIndex, 0),
                set(dotScaleConfig.toValue, 0),
                cond(intersects, startClock(endClock)),
                startClock(clock),
                set(this.ringConfig.toValue, cond(intersects, ringScales.out, ringScales.disabled)),
                startClock(this.ringClock),
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

  renderPlaceholder = () => (
    <Animated.View
      style={{
        position: 'absolute',
        opacity: 0.85,
        width: dotSize,
        height: dotSize,
        borderRadius: dotSize / 2,
        backgroundColor: this.placeholderDot.color,
        zIndex: 999,
        transform: [{
          translateX: this.placeholderDot.x,
          translateY: this.placeholderDot.y,
          scaleX: this.placeholderDot.scale,
          scaleY: this.placeholderDot.scale,
        }]
      }}
    />
  )

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
            borderColor: this.ring.color,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 20,
            transform: [{
              translateX,
              translateY,
              scaleX: this.ringScale,
              scaleY: this.ringScale,
            }]
          }}
        />

        {this.renderPlaceholder()}

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