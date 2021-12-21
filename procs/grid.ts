import { Dimensions } from 'react-native'
import Animated from 'react-native-reanimated'
const { width } = Dimensions.get('window')

let { interpolateNode: interpolate, proc, multiply, add, sub, block, set, abs } = Animated

if (!proc) {
  proc = fn => fn
}

const gravity = Math.PI / 2
const influenceDist = width / 2


const rotateYProc = proc(rotateAmtX => interpolate(rotateAmtX, {
  inputRange: [-1, -0.25, 0, 0.25, 1],
  outputRange: [0, -gravity, 0, gravity, 0],
  extrapolate: Animated.Extrapolate.CLAMP,
}))

const rotateXProc = proc(rotateAmtY => interpolate(rotateAmtY, {
  inputRange: [-1, -0.25, 0, 0.25, 1],
  outputRange: [0, gravity, 0, -gravity, 0],
  extrapolate: Animated.Extrapolate.CLAMP,
}))

const scaleProc = proc((pctX, pctY, multiplier) => interpolate(
  multiply(
    add(pctX, pctY), 
    multiplier
  ), {
  inputRange: [0, 2],
  outputRange: [1, 0.85],
}))

const diffXRatioProc = proc((centerX, screenX) => interpolate(sub(centerX, screenX), {
  inputRange: [-influenceDist, 0, influenceDist],
  outputRange: [-1, 0, 1],
  extrapolate: Animated.Extrapolate.CLAMP,
}))

const diffYRatioProc = proc((centerY, screenY) => interpolate(sub(centerY, screenY), {
  inputRange: [-influenceDist, 0, influenceDist],
  outputRange: [-1, 0, 1],
  extrapolate: Animated.Extrapolate.CLAMP,
}))

const pctProc = proc((val) => interpolate(val, {
  inputRange: [-1, 0, 1],
  outputRange: [0, 1, 0],
  extrapolate: Animated.Extrapolate.CLAMP,
}))

const multProc = proc((v1, v2, v3) => multiply(v1, v2, v3))

export const combinedXProc = proc((centerX, centerY, screenX, screenY, multiplier) => multProc(
  rotateXProc(
    diffYRatioProc(centerY, screenY)
  ), pctProc(diffXRatioProc(centerX, screenX)), multiplier)
  )

export const combinedYProc = proc((centerX, centerY, screenX, screenY, multiplier) => multProc(
  rotateYProc(
    diffXRatioProc(centerX, screenX)
  ), pctProc(diffYRatioProc(centerY, screenY)), multiplier)
  )

const setPan = proc((pan, translationX, newTransX, translationY, newTransY) => block([
  set(pan,
    add(
      pan,
      abs(sub(translationX, newTransX)),
      abs(sub(translationY, newTransY)),
    )
  ),
  set(translationX, newTransX),
  set(translationY, newTransY),
]))

const reset = proc((v1, v2, v3, v4) => block([
  set(v1, 0),
  set(v2, 0),
  set(v3, 0),
  set(v4, 0)
]))

export const Procs = {
  rotateY: rotateYProc,
  rotateX: rotateXProc,
  scale: scaleProc,
  diffXRatio: diffXRatioProc,
  diffYRatio: diffYRatioProc,
  pct: pctProc,
  mult: multProc,
  combinedX: combinedXProc,
  combinedY: combinedYProc,
  setPan,
  reset,
}