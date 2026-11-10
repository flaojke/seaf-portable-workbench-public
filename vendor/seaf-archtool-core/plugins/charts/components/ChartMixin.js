/*
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
*/

export const defaultOptions = {
  responsive: true,
  maintainAspectRatio: false
};

export default {
  props: {
    profile: {
      type: Object,
      required: true
    },
    pullData: {
      type: Function,
      required: true
    },
    datasetIdKey: {
      type: String,
      default: 'label'
    },
    cssClasses: {
      default: '',
      type: String
    },
    styles: {
      type: Object,
      default: () => { return {}; }
    },
    plugins: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      refresher: null,
      width: this.profile.width || this.profile.size || 400,
      height: this.profile.height || this.profile.size || 400,
      chartData: {
        labels: [],
        datasets: []
      },
      chartOptions: { ...defaultOptions, ...this.profile.options }
    };
  },
  watch: {
    profile() {
      this.onRefresh();
    }
  },
  mounted() {
    this.onRefresh();
  },
  methods: {
    onRefresh() {
      if (this.refresher) clearTimeout(this.refresher);
      this.refresher = setTimeout(this.doRefresh, 50);
    },
    doRefresh() {
      if (this.profile) {

        this.pullData().then((result) => {
          try {
            this.chartData.labels = [...(result?.labels || []), ...(this.profile.labels || [])];
            this.chartOptions = { ...defaultOptions, ...result?.options, ...this.profile.options };

            this.chartData.datasets = result?.datasets?.map((dataset) =>
              dataset.color ? { ...this.dataSetWithDefaultOptions(dataset), ...dataset } : dataset
            ) || [];
          } catch (e) {
            this.error = e;
          }
        }).catch((e) => this.error = e);

      }
    }
  }
};
