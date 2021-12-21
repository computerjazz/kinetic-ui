import { useNavigation } from '@react-navigation/core'
import React from 'react'
import { TouchableOpacity, Text, SafeAreaView } from 'react-native'

type Props = {
  color?: string,
}

const BackButton = ({ color }: Props) => {
  const navigation = useNavigation()
  return (
      <SafeAreaView 
        style={{ position: 'absolute' }}
        >
          <TouchableOpacity
            style={{ padding: 20 }}
            onPress={() => navigation.goBack()}
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
      </SafeAreaView>
  )
}

export default BackButton
