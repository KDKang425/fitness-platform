import React from 'react'
import { VictoryBar, VictoryChart, VictoryAxis, VictoryTheme, VictoryGroup } from 'victory-native'
import { View } from 'react-native'
import Svg from 'react-native-svg'

export default function VolumeChart({
  labels,
  current,
  previous,
}: {
  labels: string[]
  current: number[]
  previous: number[]
}) {
  return (
    <View>
      <Svg width="100%" height={220}>
        <VictoryChart
          standalone={false}
          width={340}
          height={220}
          theme={VictoryTheme.material}
          padding={{ top: 20, bottom: 40, left: 50, right: 20 }}
          domainPadding={{ x: 30 }}
        >
          <VictoryAxis style={{ tickLabels: { fill: '#fff', fontSize: 12 } }} />
          <VictoryAxis dependentAxis style={{ tickLabels: { fill: '#fff', fontSize: 12 } }} />
          <VictoryGroup offset={12}>
            <VictoryBar
              data={current.map((y, i) => ({ x: labels[i], y }))}
              style={{ data: { fill: '#ff7f27' } }}
              barWidth={10}
            />
            <VictoryBar
              data={previous.map((y, i) => ({ x: labels[i], y }))}
              style={{ data: { fill: '#555' } }}
              barWidth={10}
            />
          </VictoryGroup>
        </VictoryChart>
      </Svg>
    </View>
  )
}
