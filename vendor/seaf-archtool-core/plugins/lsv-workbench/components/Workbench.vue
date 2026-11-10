<template>
  <section class="lsv-workbench">
    <div class="workbench-link"><a v-bind:href="workbenchUrl" target="_blank" rel="noopener">Открыть рабочее пространство в отдельном окне</a></div>
    <p v-if="isPreview" class="preview-note">Это изолированный preview архитектуры. Исходники доступны для просмотра; изменения основного проекта выполняются в отдельном рабочем пространстве по ссылке выше.</p>
    <iframe v-else-if="ready" title="Рабочее пространство SEAF — LSV" v-bind:src="workbenchUrl" sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-popups allow-modals" />
  </section>
</template>
<script>
  export default {
    name:'LSVWorkbench',
    props:{profile:{type:Object,default:()=>({})},document:{type:String,default:''},params:{type:Object,default:()=>({})}},
    data:()=>({baseUrl:'http://localhost:8091/',isPreview:window.location.port!=='8080',ready:false}),
    computed:{workbenchUrl(){const url=new URL(this.baseUrl);if(['home','stack','projects','editor','objects','composer','scenarios','passport','wizard','connect','diagnostics','drafts','graph','trust','snapshots','diff','compare','ai','assistant','drawio'].includes(this.profile?.view))url.searchParams.set('view',this.profile.view);if(this.$route?.query?.['seaf-search']==='1')url.searchParams.set('palette','1');return url.href;}},
    async mounted(){
      try{
        const response=await fetch('/api/env-config');
        if(response.ok){const config=await response.json();if(config.workbenchUrl){const url=new URL(config.workbenchUrl);if(url.protocol==='http:'&&['localhost','127.0.0.1'].includes(url.hostname)&&!url.username&&!url.password){this.baseUrl=url.href;this.isPreview=!!config.isolatedPreview;}}}
      }catch{ /* Keep the legacy local URL if the optional runtime config is unavailable. */ }finally{this.ready=true;}
    }
  };
</script>
<style scoped>
.lsv-workbench{width:100%;height:calc(100vh - 120px);min-height:700px;background:#f4f6f9}.lsv-workbench iframe{width:100%;height:calc(100% - 30px);border:0}.workbench-link{padding:4px 16px;text-align:right;font-size:12px}.preview-note{padding:32px;max-width:900px;font-size:18px;line-height:1.7}
</style>
