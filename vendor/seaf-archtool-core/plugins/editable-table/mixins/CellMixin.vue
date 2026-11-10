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
      Alexandr Anenburg <anenburg.alexandr@mail.ru>, Sber

  Contributors:
      Alexandr Anenburg <anenburg.alexandr@mail.ru>, Sber - 2025
-->

<script>
  import Textarea from '../components/TableCell/Textarea/Textarea.vue';
  import Select from '../components/TableCell/Select/Select.vue';
  import Checkbox from '../components/TableCell/Checkbox/Checkbox.vue';
  import Text from '../components/TableCell/Text.vue';
  import Markdown from '../components/TableCell/Markdown/Markdown.vue';
  import Link from '../components/TableCell/Link/Link.vue';
  import Function from '../components/TableCell/Function/Function.vue';
  import Upload from '../components/TableCell/Upload/Upload.vue';
  import CellError from '../components/TableCell/CellError.vue';
  import { CellDataError } from '../lib/const';

  export default {
    components: {
      'dh-textarea': Textarea,
      'dh-select': Select,
      'dh-checkbox': Checkbox,
      'dh-text': Text,
      'dh-markdown': Markdown,
      'dh-link': Link,
      'dh-fn': Function,
      'dh-upload': Upload,
      'dh-error': CellError
    },
    props: {
      header: {
        type: Object,
        required: true
      },
      row: {
        type: Object,
        required: false,
        default: () => ({})
      },
      rowID: {
        type: String,
        required: false,
        default: () => null
      },
      hasMergedOptions: {
        type: Boolean,
        required: false,
        default: false
      }
    },
    data() {
      return {
        type: this.header.type,
        renderMode: this.header.render,
        headerID: this.header.headerID,
        disabled: !this.header.editable,
        options: this.header.options,
        optionID: this.header.optionID,
        fn: this.header.fn,
        styles: this.header.styles,
        classCell: {
          'cell_pinned': this.header.pinned,
          'cell_editable': this.header.editable
        },
        hasError: this.row[this.header.headerID] instanceof CellDataError
      };
    }

  };
</script>
