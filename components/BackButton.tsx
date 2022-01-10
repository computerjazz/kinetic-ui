import * as React from 'react'
import { TouchableOpacity, Text, View } from 'react-native'
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type Props = {
  color?: string,
}

const BackButton = ({ color }: Props) => {
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  return (
      <View 
        style={{ position: 'absolute', marginTop: insets.top + 16 }} 
        >
          <TouchableOpacity 
            style={{ padding: 20 }}
            onPress={() => {
              navigation.goBack(null)
            }}   
          >
            <Text 
              style={{ 
                fontSize: 30, 
                fontWeight: 'bold', 
                color: color || '#ddd' 
              }}
            >
            ←
            </Text>
          </TouchableOpacity>
      </View>
  )
}

export default BackButton
