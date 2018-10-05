<template>
    <div class="renameAttachment">
        <h3>{{ i18n('update_links') }}</h3>
        <span>{{ i18n('checked_topics') }} </span>
        <div v-if="!isLoading">
            <div class="foswikiFormStep">
                <h4>{{ i18n('income_links_own_web', attachment, web) }}</h4>
                <label
                    v-for="entry in resultWeb"
                    :key="entry.webtopic">
                    <input
                        :value="entry.webtopic"
                        v-model="selectedTopics"
                        checked="checked"
                        class="foswikiCheckBox foswikiGlobalCheckable"
                        name="referring_topics"
                        type="checkbox">
                    {{ entry.title }}
                </label>
                <span v-if="resultWeb.length == 0">{{ i18n('nothing_found') }}</span>
            </div>
            <div class="foswikiFormStep">
                <h4>{{ i18n('income_links_other_webs', attachment) }}</h4>
                <label
                    v-for="entry in resultOtherWebs"
                    :key="entry.webtopic">
                    <input
                        :value="entry.webtopic"
                        v-model="selectedTopics"
                        checked="checked"
                        class="foswikiCheckBox foswikiGlobalCheckable"
                        name="referring_topics"
                        type="checkbox">
                    {{ entry.title }}
                </label>
                <span v-if="resultOtherWebs.length == 0">{{ i18n('nothing_found') }}</span>
            </div>
            <div class="controls">
                <input 
                    :value="i18n('select_all')"
                    type="button"
                    class="foswikiButton"
                    @click="selectAll">
                <input 
                    :value="i18n('deselect_all')"
                    type="button"
                    class="foswikiButton"
                    @click="deselectAll">
                <span>{{ i18n('choose_referenced_topics') }}</span>
            </div>
        </div>
        <div v-else>
            <div
                ref="renameSpinner"
                class="renameSpinner"/>
        </div>
    </div>
</template>

<script type="text/babel">

export default {
    i18nextNamespace: 'ModacContextMenuPlugin',
    props: {
        web: {
            type: String,
            required: true
        },
        topic: {
            type: String,
            required: true
        },
        attachment: {
            type: String,
            required: true
        },
    },
    data: function(){
        return {
            resultWeb: [],
            resultOtherWebs: [],
            selectedTopics: [],
            isLoading: true
        }
    },
    mounted: async function() {
        $(this.$refs['renameSpinner']).spin(true);
        let data = await this.fetch({q: `outgoingAttachment_lst:${this.web}.${this.topic}/${this.attachment}`});
        $(this.$refs['renameSpinner']).spin(false);
        this.isLoading = false;
        if(data.response.numFound > 0){
            this.resultOtherWebs = data.response.docs.filter(d => d.web != this.web);
            this.resultWeb = data.response.docs.filter(d => d.web == this.web);
        }
    },
    methods: {
        async fetch (payloadData) {
            let queryString = "?"+Object.keys(payloadData).map(function(key){
                return `${key}=${payloadData[key]}`;
            }).join(";");
            const ajaxReqObj = {
                dataType: 'json',
                traditional: true,
                type: "GET",
                url: Vue.foswiki.getScriptUrl("rest", "SolrPlugin", "proxy")+queryString,
            };

            return $.ajax(ajaxReqObj);
        },
        selectAll () {
            this.selectedTopics = [];

            for (let web in this.resultOtherWebs) {
                this.selectedTopics.push(this.resultOtherWebs[web].webtopic);
            }
            for (let web in this.resultWeb) {
                this.selectedTopics.push(this.resultWeb[web].webtopic);
            }

        },
        deselectAll (){
            this.selectedTopics = [];
        },
        i18n (text, ...$args) {
            return Vue.foswiki.jsi18n.get('ModacContextMenu', text, ...$args);
        }
    }
}
</script>

<style lang="scss">
    .renameSpinner {
        min-height: 100px;
        position: relative;
    }
</style>
