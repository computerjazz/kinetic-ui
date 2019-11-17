import React from 'react'
import { TouchableOpacity, Text, SafeAreaView, View } from 'react-native'
import { withNavigation } from 'react-navigation'

type Props = {
  color?: string,
}

const BackButton = ({ color, navigation }: Props) => {
  return (
      <SafeAreaView 
        style={{ position: 'absolute' }}
        >
          <TouchableOpacity
            style={{ padding: 20 }}
            onPress={() => navigation.goBack(null)}
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

export default withNavigation(BackButton)
