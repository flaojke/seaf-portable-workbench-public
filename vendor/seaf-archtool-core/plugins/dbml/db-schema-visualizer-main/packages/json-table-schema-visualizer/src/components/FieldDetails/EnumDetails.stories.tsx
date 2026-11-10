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
      Vladislav Markin, Sber - 2025
*/

import EnumDetails from "./EnumDetails";

import type { Meta, StoryObj } from "@storybook/react";

import EnumsProvider from "@/providers/EnumsProvider";
import { exampleData } from "@/fake/fakeJsonTables";

const meta: Meta = {
  component: EnumDetails,
  title: "components/EnumDetails",
};

export default meta;

type Story = StoryObj<typeof EnumDetails>;

export const EnumDetailsStory: Story = {
  render: (props) => (
    <EnumsProvider enums={exampleData.enums}>
      <EnumDetails {...props} />
    </EnumsProvider>
  ),
  args: {
    enumName: "status",
  },
  parameters: {
    withKonvaWrapper: true,
  },
};
