<!--
  Copyright (C) 2023 Sber

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

          http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.

  Maintainers:
      Vladislav Markin, Sber

  Contributors:
      Vladislav Markin, Sber - 2023
-->

<template>
  <radar
    v-bind:chart-options="chartOptions"
    v-bind:chart-data="chartData"
    v-bind:chart-id="chartId"
    v-bind:dataset-id-key="datasetIdKey"
    v-bind:plugins="plugins"
    v-bind:css-classes="cssClasses"
    v-bind:styles="styles"
    v-bind:width="width"
    v-bind:height="height" />
</template>

<script>
  import { Radar } from 'vue-chartjs';

  import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    PointElement,
    LineElement,
    RadialLinearScale,
    Filler
  } from 'chart.js';
  import Color from 'chartjs-color';
  import chartMixin from '../ChartMixin';

  ChartJS.register(
    Title,
    Tooltip,
    Legend,
    PointElement,
    RadialLinearScale,
    LineElement,
    Filler
  );

  export default {
    name: 'RadarChart',
    components: {
      Radar
    },
    mixins: [chartMixin],
    props: {
      chartId: {
        type: String,
        default: 'radar-chart'
      }
    },
    methods: {
      dataSetWithDefaultOptions(dataset) {
        const color = new Color(dataset.color);
        return {
          label: dataset.label,
          backgroundColor: color.clone().alpha(0.2).rgbString(),
          borderColor: dataset.color,
          pointBackgroundColor: dataset.color,
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: dataset.color,
          data: dataset.data
        };
      }
    }
  };
</script>
