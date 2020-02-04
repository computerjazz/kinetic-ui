import { Animated, Easing } from 'react-native'

export const transitionConfig = () => {
  return {
    transitionSpec: {
      duration: 750,
      easing: Easing.out(Easing.poly(4)),
      timing: Animated.timing,
      useNativeDriver: true,
    },
    screenInterpolator: sceneProps => {
      const { position, scene } = sceneProps

      const thisSceneIndex = scene.index

      const opacity = position.interpolate({
        inputRange: [thisSceneIndex - .5, thisSceneIndex, thisSceneIndex + 0.5],
        outputRange: [0, 1, 0],
      })

      const scale = position.interpolate({
        inputRange: [thisSceneIndex - 1, thisSceneIndex],
        outputRange: [0.75, 1],
        extrapolate: "clamp"
      })

      return { 
        opacity,
        transform: [
          { scaleX: scale },
          { scaleY: scale },
        ] 
      }
    },
  }
}