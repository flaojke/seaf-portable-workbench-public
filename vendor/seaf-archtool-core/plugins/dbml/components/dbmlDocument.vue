<template>
  <div id="dbml_app" ref="container" />
</template>

<script>
  import { ReactConnector } from './ReactConnector/ReactConnector';
  import { parseDBMLToJSON } from './libCode/libCode';
  import './libCode/libCode.css';

  export default {
    name: 'DbmlDocument',
    props: {
      profile: {
        type: Object,
        required: true
      },
      getContent: {
        type: Function,
        required: true
      }
    },
    data() {
      return {
        refresher: null
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
      doRefresh() {
        if (this.profile) {
          const reactContainer = new ReactConnector(this.$refs.container);
          this.getContent(this.profile.source)
            .then((response) => {
              reactContainer.render(parseDBMLToJSON(response.data));
            })
            .catch((error) => {
              reactContainer.renderError(error);
            });
        }
      },

      onRefresh() {
        if (this.refresher) clearTimeout(this.refresher);
        this.refresher = setTimeout(this.doRefresh, 50);
      }
    }
  };
</script>

<style scoped>
#dbml_app {
  height: 100%;
  border-top: 1px solid #d1d5dc;
  border-bottom: 1px solid #d1d5dc;
}
</style>
