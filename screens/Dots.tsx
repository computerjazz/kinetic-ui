import React, { Component } from 'react';
import { Dimensions, StyleSheet, SafeAreaView } from 'react-native';
import Animated, { Easing } from 'react-native-reanimated';
import { PanGestureHandler, State, TapGestureHandler } from 'react-native-gesture-handler';

import BackButton from '../components/BackButton'

const { width, height } = Dimensions.get("window")

const dropZoneRadius = width / 3
const translateX = width / 2 - dropZoneRadius / 2
const translateY = height / 2 - dropZoneRadius / 2

const dotSize = width / 5

const additionalScale = 0.5
const numDots = 7
const ringScales = {
  disabled: 0,
  in: 2,
  out: 15,
}

const dotCenterX = width / 2 - dotSize / 2
const dotCenterY = height / 2 - dotSize / 2

const {
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
  event,
  sin,
  round,
  abs,
  color,
  onChange,
  Value,
  Clock,
} = Animated;


type Dot = {

}

class Dots extends Component {

  dropZoneRotate: Animated.Node<number>
  scaleVal: Animated.Value<number>
  scaleConfig: Animated.TimingConfig
  dropZoneScale: Animated.Node<number>
  dots: Dot[]

  constructor(props) {
    super(props);

    const xl = width / 2 - dropZoneRadius / 2
    const xr = xl + dropZoneRadius
    const yt = height / 2 - dropZoneRadius / 2
    const yb = yt + dropZoneRadius
    const dotRadius = dotSize * (1 + additionalScale)

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

    this.dropZoneRotate = block([
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

    const dropZoneClock = new Clock()

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
      cond(not(clockRunning(dropZoneClock)), startClock(dropZoneClock)),
      timing(dropZoneClock, scaleState, this.scaleConfig),
      cond(scaleState.finished, [
        stopClock(dropZoneClock),
        set(scaleState.position, 0),
        set(scaleState.time, 0),
        set(scaleState.frameTime, 0),
        set(scaleState.finished, 0),
        startClock(dropZoneClock),
      ]),
      scaleState.position,
    ])

    this.dropZoneScale = add(1, multiply(this.scaleVal, sin(runScale)))

    this.dots = [...Array(numDots)].map((d, index, arr) => {
      const colorMultiplier = 255 / (arr.length - 1)

      const clock = new Clock();

      const dragX = new Value(0);
      const dragY = new Value(0);
      const ratio = index / arr.length

      const startX = new Value(dotCenterX + Math.sin(ratio * Math.PI * 2) * dropZoneRadius)
      const startY = new Value(dotCenterY + Math.cos(ratio * Math.PI * 2) * dropZoneRadius)

      const prevX = new Value(0);
      const prevY = new Value(0);

      const dotScaleState = {
        finished: new Value(0),
        velocity: new Value(0),
        position: new Value(0.001),
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

      const dotCenter = {
        x: add(x.translate, dotRadius / 2),
        y: add(y.translate, dotRadius / 2)
      }

      const intersects = cond(
        and(
          greaterThan(dotCenter.x, xl),
          lessThan(dotCenter.x, xr),
          greaterThan(dotCenter.y, yt),
          lessThan(dotCenter.y, yb),
        ), 1, 0)

      const endClock = new Clock
      const endDisabled = 0.01
      const endState = {
        disabled: endDisabled,
        position: new Value(endDisabled),
        finished: new Value(0),
        time: new Value(0),
        frameTime: new Value(0),
      }
      const endConfig = {
        easing: Easing.linear,
        duration: 1000,
        toValue: 1,
      }
      // Ring
      // Ring animation
      const ringR = new Value(0)
      const ringG = new Value(0)
      const ringB = new Value(0)
      const ringA = new Value(0)

      const ringClock = new Clock()
      const ringState = {
        position: new Value(0.001),
        time: new Value(0),
        finished: new Value(0),
        velocity: new Value(0),
      }
      const ringConfig = {
        damping: 22,
        mass: 1,
        stiffness: 55,
        overshootClamping: false,
        restSpeedThreshold: 0.001,
        restDisplacementThreshold: 0.001,
        toValue: new Value(ringScales.in),
      }

      const ringScale = block([
        cond(clockRunning(ringClock), [
          spring(ringClock, ringState, ringConfig),
          cond(ringState.finished, [
            stopClock(ringClock),
            set(ringState.time, 0),
            set(ringState.velocity, 0),
            set(ringState.finished, 0),
          ])
        ]),
        ringState.position,
      ])

      const ringColor = color(ringR, ringG, ringB, ringA)
      const ringOpacity = cond(
        and(
          greaterThan(ringState.position, ringScales.disabled + .05),
          lessThan(ringState.position, ringScales.out - .05),
        ), 0.85, 0)

      const ring = {
        clock: ringClock,
        state: ringState,
        config: ringConfig,
        scale: sub(add(this.dropZoneScale, ringScale), 1),
        r: ringR,
        g: ringG,
        b: ringB,
        a: ringA,
        color: ringColor,
        rgb: {
          r: ringR,
          g: ringG,
          b: ringB,
          a: ringA,
        },
        opacity: ringOpacity
      }

      // Placeholder
      const placeholderR = new Value(0)
      const placeholderG = new Value(0)
      const placeholderB = new Value(0)
      const placeholderA = new Value(0)

      const placeholder = {
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

      const runEndClock = [
        timing(endClock, endState, endConfig),
        cond(endState.finished, [
          stopClock(endClock),
          set(placeholder.a, 0),
          set(endState.finished, 0),
          set(endState.time, 0),
          set(endState.frameTime, 0),
        ]),
        endState.position,
      ]

      const scale = cond(
        clockRunning(endClock), [
        set(placeholder.scale, multiply(add(1, additionalScale), add(1, multiply(-1, runEndClock)))),
        runEndClock,
      ], [
        cond(neq(endState.position, endState.disabled), set(endState.position, endState.disabled)),
        add(multiply(runClock, additionalScale), 1)
      ],
      )

      return {
        panGestureState: new Value(State.UNDETERMINED),
        tapGestureState: new Value(State.UNDETERMINED),
        zIndex: new Value(999),
        intersects,
        x,
        y,
        scale: {
          clock: clock,
          value: scale,
          state: dotScaleState,
          config: dotScaleConfig,
        },
        clock,
        endClock,
        endState,
        color: dotColor,
        rgb: { r, g, b },
        placeholder,
        ring,
      }
    })
  }

  renderDot = ({
    x,
    y,
    color,
    rgb,
    scale,
    panGestureState,
    tapGestureState,
    endClock,
    endState,
    zIndex,
    intersects,
    placeholder,
    ring,
  }, i) => {

    const onDotInactive = [
      cond(intersects, [
        set(placeholder.a, 1),
        set(endState.position, endState.disabled),
        startClock(endClock),
      ], set(placeholder.a, 0)),

      set(scale.config.toValue, 0),
      startClock(scale.clock),

      set(ring.config.toValue, cond(intersects, ringScales.out, ringScales.disabled)),
      startClock(ring.clock),
      set(zIndex, 999),
    ]

    const onDotActive = [
      set(ring.a, 0), // Hide ring spring back to center
      set(placeholder.a, 0),
      set(ring.r, rgb.r),
      set(ring.g, rgb.g),
      set(ring.b, rgb.b),
      set(placeholder.r, rgb.r),
      set(placeholder.g, rgb.g),
      set(placeholder.b, rgb.b),
      set(zIndex, 9999),
      set(scale.config.toValue, 1),
      startClock(scale.clock),

      cond(or(
        clockRunning(ring.clock),
        neq(ring.state.position, ringScales.disabled),
      ), [
        stopClock(ring.clock),
        set(ring.state.position, ringScales.disabled),
        set(ring.state.finished, 0),
        set(ring.state.velocity, 0),
        set(ring.state.time, 0),
      ]),
    ]

    return (
      <PanGestureHandler
        key={`dot-${i}`}
        onGestureEvent={event([{
          nativeEvent: ({ translationX, translationY }) => block([
            cond(eq(panGestureState, State.ACTIVE), [
              // Dot entering center
              cond(
                and(
                  intersects,
                  not(clockRunning(ring.clock)),
                  neq(ring.state.position, ringScales.in),
                ),
                [
                  set(ring.a, 1),
                  set(ring.state.position, ringScales.disabled),
                  set(ring.config.toValue, ringScales.in),
                  startClock(ring.clock),
                ]
              ),
              // Dot leaving center
              cond(
                and(
                  not(intersects),
                  not(clockRunning(ring.clock)),
                  neq(ring.state.position, ringScales.disabled),
                ), [
                set(ring.config.toValue, ringScales.disabled),
                startClock(ring.clock),
              ]
              ),
              set(x.drag, translationX),
              set(y.drag, translationY),
              cond(intersects, [
                set(placeholder.x, x.translate),
                set(placeholder.y, y.translate),
              ]),
            ])
          ]),
        }])}
        onHandlerStateChange={event([{
          nativeEvent: ({ state }) => block([
            // Dot becoming inactive
            cond(
              and(
                eq(panGestureState, State.ACTIVE),
                neq(state, State.ACTIVE),
              ), onDotInactive),
            set(panGestureState, state),
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
        <TapGestureHandler
          onHandlerStateChange={event([{
            nativeEvent: ({ state, translationX, translationY }) => block([
              set(tapGestureState, state),
              onChange(tapGestureState, [
                cond(eq(tapGestureState, State.BEGAN), [
                  set(x.drag, translationX),
                  set(y.drag, translationY),
                  onDotActive
                ]),
                cond(eq(tapGestureState, State.END), onDotInactive),
              ])
            ])
          }])}
        >
          <Animated.View
            style={{
              position: 'absolute',
              opacity: 0.85,
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: color,
              transform: [{
                scaleX: scale.value,
                scaleY: scale.value,
              }]
            }}
          />
            </TapGestureHandler>
        </Animated.View>
      </PanGestureHandler>
    )
  }

  renderPlaceholder = ({ placeholder }, i) => (
    <Animated.View
      key={`placeholder-${i}`}
      style={{
        position: 'absolute',
        opacity: 0.85,
        width: dotSize,
        height: dotSize,
        borderRadius: dotSize / 2,
        backgroundColor: placeholder.color,
        zIndex: 999,
        transform: [{
          translateX: placeholder.x,
          translateY: placeholder.y,
          scaleX: placeholder.scale,
          scaleY: placeholder.scale,
        }]
      }}
    />
  )

  renderRing = ({ ring }, i) => {
    return (
      <Animated.View
        key={`ring-${i}`}
        style={{
          position: 'absolute',
          opacity: ring.opacity,
          width: dropZoneRadius,
          height: dropZoneRadius,
          borderRadius: dropZoneRadius,
          borderColor: ring.color,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 20,
          transform: [{
            translateX,
            translateY,
            scaleX: ring.scale,
            scaleY: ring.scale,
          }]
        }}
      />
    )
  }

  renderDropZone = () => {
    return (
      <Animated.View
        style={{
          position: 'absolute',
          width: dropZoneRadius,
          height: dropZoneRadius,
          borderRadius: dropZoneRadius,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 5,
          borderStyle: 'dotted',
          backgroundColor: 'seashell',
          borderColor: '#ccc',
          transform: [{
            translateX,
            translateY,
            rotate: this.dropZoneRotate,
            scaleX: this.dropZoneScale,
            scaleY: this.dropZoneScale,
          }]
        }}
      />
    )
  }

  render() {
    return (
      <Animated.View style={styles.container}>
        <SafeAreaView>
          {this.dots.map(this.renderRing)}
          {this.dots.map(this.renderPlaceholder)}
          {this.renderDropZone()}
          {this.dots.map(this.renderDot)}
          </SafeAreaView>
          <BackButton />
      </Animated.View>
    )
  }
}

export default Dots

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'seashell',
    overflow: 'hidden',
  },
});