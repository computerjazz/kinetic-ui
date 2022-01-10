import React, { Component } from 'react';
import { Dimensions, StyleSheet, SafeAreaView , Text} from 'react-native';
import Animated, {
  defined,
  EasingNode as Easing,
  and,
  not,
  set,
  neq,
  cond,
  add,
  multiply,
  block,
  startClock,
  stopClock,
  clockRunning,
  sub,
  event,
  round,
  abs,
  call,
  color,
  Value,
  Clock,
  max,
} from 'react-native-reanimated';
import {
  PanGestureHandler,
  State,
  TapGestureHandler,
  LongPressGestureHandler,
} from 'react-native-gesture-handler';

import BackButton from '../components/BackButton';
import spring from '../procs/springFill';
import timingFill from '../procs/timingFill';
import procs from '../procs/dots';

const { linear: timing } = timingFill;
const { width, height } = Dimensions.get('window');

const dropZoneRadius = width / 3;
const translateX = width / 2 - dropZoneRadius / 2;
const translateY = height / 2 - dropZoneRadius / 2;

const dotSize = width / 5;

const additionalScale = 0.5;
const numDots = 7;
const colorMultiplier = 255 / (numDots - 1);

const ringScales = {
  disabled: 0.01,
  in: 2,
  out: 15,
};

const dotCenterX = width / 2 - dotSize / 2;
const dotCenterY = height / 2 - dotSize / 2;
const xl = width / 2 - dropZoneRadius / 2;
const xr = xl + dropZoneRadius;
const yt = height / 2 - dropZoneRadius / 2;
const yb = yt + dropZoneRadius;
const dotRadius = dotSize * (1 + additionalScale);

class Dots extends Component {
  constructor(props) {
    super(props);
    this.dropZoneClock = new Clock();
    this.rotClock = new Clock();

    this.rotState = {
    position: new Value(0),
    time: new Value(0),
    frameTime: new Value(0),
    finished: new Value(0),
  };
  this.rotConfig = {
    easing: Easing.linear,
    toValue: Math.PI * 2,
    duration: 20000,
  };
  this.scaleState = {
    position: new Value(0),
    time: new Value(0),
    frameTime: new Value(0),
    finished: new Value(0),
  };
  this.scaleConfig = {
    easing: Easing.linear,
    toValue: Math.PI * 2,
    duration: new Value(1000),
  };

  this.dropZoneScale = procs.getDropZoneScale(this.scaleState.position);

  this.dots = [...Array(numDots)].map((d, index, arr) => {
    const ratio = index / arr.length;
    const startPos = {
      x: dotCenterX + Math.sin(ratio * Math.PI * 2) * dropZoneRadius,
      y: dotCenterY + Math.cos(ratio * Math.PI * 2) * dropZoneRadius,
    };

    const clock = new Clock();
    const dragX = new Value(0);
    const dragY = new Value(0);
    const startX = new Value(startPos.x);
    const startY = new Value(startPos.y);

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

    const c = multiply(index, colorMultiplier);
    const r = round(c);
    const g = round(abs(sub(128, c)));
    const b = round(sub(255, c));
    const dotColor = color(r, g, b);

    const x = {
      start: startX,
      drag: dragX,
      translate: procs.getTranslate(startX, dotScaleState.position, dragX),
    };

    const y = {
      start: startY,
      drag: dragY,
      translate: procs.getTranslate(startY, dotScaleState.position, dragY),
    };

    const dotCenter = {
      x: procs.getCenter(x.translate, dotRadius),
      y: procs.getCenter(y.translate, dotRadius),
    };

    const intersects = procs.intersects(
      dotCenter.x,
      dotCenter.y,
      xl,
      xr,
      yt,
      yb
    );

    const endClock = new Clock();
    const endDisabled = 0.01;
    const endState = {
      disabled: endDisabled,
      position: new Value(endDisabled),
      finished: new Value(0),
      time: new Value(0),
      frameTime: new Value(0),
    };
    const endConfig = {
      easing: Easing.linear,
      duration: 1000,
      toValue: 1,
    };
    // Ring
    // Ring animation
    const ringR = new Value(0);
    const ringG = new Value(0);
    const ringB = new Value(0);
    const ringA = new Value(0);

    const ringClock = new Clock();
    const ringState = {
      position: new Value(0.001),
      time: new Value(0),
      finished: new Value(0),
      velocity: new Value(0),
    };
    const ringConfig = {
      damping: 22,
      mass: 1,
      stiffness: 55,
      overshootClamping: false,
      restSpeedThreshold: 0.001,
      restDisplacementThreshold: 0.001,
      toValue: new Value(ringScales.in),
    };

    const ringColor = color(ringR, ringG, ringB, ringA);
    const ringOpacity = procs.getRingOpacity(
      ringState.position,
      ringScales.disabled,
      ringScales.out
    );

    const ring = {
      clock: ringClock,
      state: ringState,
      config: ringConfig,
      scale: sub(add(this.dropZoneScale, ringState.position), 1),
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
      opacity: ringOpacity,
    };

    // Placeholder
    const placeholderR = new Value(0);
    const placeholderG = new Value(0);
    const placeholderB = new Value(0);
    const placeholderA = new Value(0);

    const placeholder = {
      x: new Value(startPos.x),
      y: new Value(startPos.y),
      r: placeholderR,
      g: placeholderG,
      b: placeholderB,
      a: placeholderA,
      color: color(placeholderR, placeholderG, placeholderB, placeholderA),
      scale: new Value(0.01),
    };

    const endClockRunning = cond(defined(endClock), clockRunning(endClock));
    const startEndClock = cond(defined(endClock), startClock(endClock));
    const stopEndClock = cond(defined(endClock), stopClock(endClock));

    const scaleVal = procs.getScale(
      endClockRunning,
      endState.position,
      endState.disabled,
      dotScaleState.position,
      additionalScale
    );

    const scale = {
      clock: clock,
      value: scaleVal,
      state: dotScaleState,
      config: dotScaleConfig,
    };

    const mainClockRunning = cond(defined(clock), clockRunning(clock));
    const stopMainClock = cond(defined(clock), stopClock(clock));

    const ringClockRunning = cond(
      defined(ring.clock),
      clockRunning(ring.clock)
    );
    const startRingClock = cond(defined(ring.clock), startClock(ring.clock));
    const stopRingClock = cond(defined(ring.clock), stopClock(ring.clock));

    const startScaleClock = cond(defined(scale.clock), startClock(scale.clock));

    const dotActive = new Value(0);

    const panGestureState = new Value(State.UNDETERMINED);
    const longPressGestureState = new Value(State.UNDETERMINED);
    const tapGestureState = new Value(State.UNDETERMINED);
    const zIndex = new Value(999);

    const rgb = { r, g, b };

    const onDotInactive = procs.onDotInactive(
      dotActive,
      intersects,
      placeholder.a,
      endState.position,
      endState.disabled,
      scale.config.toValue,
      ring.config.toValue,
      ringScales.out,
      ringScales.disabled,
      zIndex,
      startEndClock,
      startScaleClock,
      startRingClock
    );

    const onDotActive = procs.onDotActive(
      dotActive,
      ring.r,
      ring.g,
      ring.b,
      ring.a,
      rgb.r,
      rgb.g,
      rgb.b,
      placeholder.r,
      placeholder.g,
      placeholder.b,
      placeholder.a,
      zIndex,
      scale.config.toValue,
      ringClockRunning,
      stopRingClock,
      startScaleClock,
      ring.state.position,
      ring.state.finished,
      ring.state.velocity,
      ring.state.time,
      ringScales.disabled
    );

    const onPanGestureEvent = event([
      {
        nativeEvent: ({ translationX, translationY }) =>
          procs.onPanGestureEvent(
            panGestureState,
            x.drag,
            y.drag,
            translationX,
            translationY,
            placeholder.x,
            placeholder.y,
            x.translate,
            y.translate
          ),
      },
    ]);

    const onPanStateChange = event([
      {
        nativeEvent: ({ state }) =>
          procs.onPanStateChange(
            panGestureState,
            state,
            onDotActive,
            onDotInactive,
            dotActive
          ),
      },
    ]);

    const onLongPressStateChange = event([
      {
        nativeEvent: ({ state, translationX, translationY }) =>
          procs.onTapStateChange(
            longPressGestureState,
            state,
            x.drag,
            y.drag,
            translationX,
            translationY,
            onDotActive,
            onDotInactive,
            dotActive
          ),
      },
    ]);

    const onTapStateChange = event([
      {
        nativeEvent: ({ state, translationX, translationY }) =>
          procs.onTapStateChange(
            tapGestureState,
            state,
            x.drag,
            y.drag,
            translationX,
            translationY,
            onDotActive,
            onDotInactive,
            dotActive
          ),
      },
    ]);

    const outerStyle = {
      flex: 1,
      position: 'absolute',
      width: dotSize,
      height: dotSize,
      zIndex,
      transform: [{ translateX: x.translate }, { translateY: y.translate }],
    };

    const innerStyle = {
      position: 'absolute',
      opacity: 0.85,
      width: dotSize,
      height: dotSize,
      borderRadius: dotSize / 2,
      backgroundColor: dotColor,
      transform: [{ scaleX: scale.value }, { scaleY: scale.value }],
    };

    const placeholderStyle = {
      position: 'absolute',
      opacity: 0.85,
      width: dotSize,
      height: dotSize,
      borderRadius: dotSize / 2,
      backgroundColor: placeholder.color,
      zIndex: 999,
      transform: [
        { translateX: placeholder.x },
        { translateY: placeholder.y },
        { scaleX: placeholder.scale },
        { scaleY: placeholder.scale },
      ],
    };

    const ringStyle = {
      position: 'absolute',
      opacity: ring.opacity,
      width: dropZoneRadius,
      height: dropZoneRadius,
      borderRadius: dropZoneRadius,
      borderColor: ring.color,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 20,
      left: translateX,
      top: translateY,
      transform: [
        { scaleX: ring.scale },
        { scaleY: ring.scale },
      ],
    };

    const runCode = () =>
      block([
        cond(
          and(
            defined(clock),
            defined(ring.clock),
            defined(scale.clock),
            defined(endClock)
          ),
          [
            // Dot entering center
            cond(
              and(
                intersects,
                not(ringClockRunning),
                neq(ring.state.position, ringScales.in)
              ),
              [
                set(ring.a, 1),
                set(ring.state.position, ringScales.disabled),
                set(ring.config.toValue, ringScales.in),
                startRingClock,
              ]
            ),
            // Dot leaving center
            cond(
              and(
                not(intersects),
                not(ringClockRunning),
                neq(ring.state.position, ringScales.disabled)
              ),
              [set(ring.config.toValue, ringScales.disabled), startRingClock]
            ),
            cond(mainClockRunning, [
              spring(clock, dotScaleState, dotScaleConfig),
              cond(dotScaleState.finished, [
                stopMainClock,
                procs.reset3(
                  dotScaleState.finished,
                  dotScaleState.velocity,
                  dotScaleState.time
                ),
              ]),
            ]),
            cond(endClockRunning, [
              timing(endClock, endState, endConfig),
              set(
                placeholder.scale,
                max(
                  0.01,
                  multiply(
                    add(1, additionalScale),
                    add(1, multiply(-1, endState.position))
                  )
                )
              ),
              cond(endState.finished, [
                stopEndClock,
                procs.reset4(
                  placeholder.a,
                  endState.finished,
                  endState.time,
                  endState.frameTime
                ),
              ]),
            ]),
            cond(ringClockRunning, [
              spring(ringClock, ringState, ringConfig),
              cond(ringState.finished, [
                stopRingClock,
                procs.reset3(
                  ringState.time,
                  ringState.velocity,
                  ringState.finished
                ),
              ]),
            ]),
          ]
        ),
      ]);

    return {
      panRef: React.createRef(),
      onPanGestureEvent,
      onPanStateChange,
      onLongPressStateChange,
      onTapStateChange,
      placeholder,
      outerStyle,
      innerStyle,
      ringStyle,
      placeholderStyle,
      runCode,
    };
  });
  }

  

  renderDot = (
    {
      panRef,
      onPanGestureEvent,
      onPanStateChange,
      onLongPressStateChange,
      onTapStateChange,
      runCode,
      outerStyle,
      innerStyle,
    },
    i
  ) => {
    return (
      <Animated.View key={`dot-${i}`} style={outerStyle}>
        <PanGestureHandler
          ref={panRef}
          onGestureEvent={onPanGestureEvent}
          onHandlerStateChange={onPanStateChange}>
          <Animated.View style={styles.flex}>
            <LongPressGestureHandler
              simultaneousHandlers={panRef}
              maxDist={0}
              onHandlerStateChange={onLongPressStateChange}>
              <Animated.View style={styles.flex}>
                <TapGestureHandler onHandlerStateChange={onTapStateChange}>
                  <Animated.View style={innerStyle} />
                </TapGestureHandler>
              </Animated.View>
            </LongPressGestureHandler>
          </Animated.View>
        </PanGestureHandler>
        <Animated.Code>{runCode}</Animated.Code>
      </Animated.View>
    );
  };

  renderPlaceholder = ({ placeholderStyle }, i) => {
    return (
      <Animated.View
        key={`placeholder-${i}`}
        pointerEvents="none"
        style={placeholderStyle}
      />
    );
  };

  renderRing = ({ ringStyle }, i) => {
    return (
      <Animated.View key={`ring-${i}`} pointerEvents="none" style={ringStyle} />
    );
  };

  renderDropZone = () => {
    return (
      <Animated.View
        pointerEvents="none"
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
          left: translateX,
          top: translateY,
          transform: [
            { rotate: Animated.concat(this.rotState.position, "rad") },
            { scaleX: this.dropZoneScale },
            { scaleY: this.dropZoneScale },
          ],
        }}
      />
    );
  };

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
        <Animated.Code>
          {() =>
            block([
              cond(and(defined(this.dropZoneClock), defined(this.rotClock)), [
                cond(
                  not(clockRunning(this.dropZoneClock)),
                  startClock(this.dropZoneClock)
                ),
                timing(this.dropZoneClock, this.scaleState, this.scaleConfig),
                cond(this.scaleState.finished, [
                  stopClock(this.dropZoneClock),
                  procs.reset4(
                    this.scaleState.position,
                    this.scaleState.time,
                    this.scaleState.frameTime,
                    this.scaleState.finished
                  ),
                  startClock(this.dropZoneClock),
                ]),
                cond(
                  not(clockRunning(this.rotClock)),
                  startClock(this.rotClock)
                ),
                timing(this.rotClock, this.rotState, this.rotConfig),
                cond(this.rotState.finished, [
                  stopClock(this.rotClock),
                  procs.reset4(
                    this.rotState.position,
                    this.rotState.time,
                    this.rotState.frameTime,
                    this.rotState.finished
                  ),
                  startClock(this.rotClock),
                ]),
              ]),
            ])
          }
        </Animated.Code>
      </Animated.View>
    );
  }
}

export default Dots;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'seashell',
    overflow: 'hidden',
  },
  flex: {
    flex: 1,
  },
});
