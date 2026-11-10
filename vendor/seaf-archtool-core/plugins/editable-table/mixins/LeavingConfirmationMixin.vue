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
  const registeredComponents = new Set();
  let unregisterRouterGuard = null;
  let guardOwner = null;
  let confirmedNavigation = false;

  function getEditedComponents() {
    return [...registeredComponents]
      .filter((comp) => Boolean(comp.tableOptions?.hasChange));
  }

  function ensureRouterGuard(router) {
    if (unregisterRouterGuard || !router?.beforeEach) return;

    unregisterRouterGuard = router.beforeEach((to, from, next) => {
      if (confirmedNavigation) {
        confirmedNavigation = false;
        next();
        return;
      }

      const editedComponents = getEditedComponents();
      if (!editedComponents.length) {
        next();
        return;
      }

      guardOwner = editedComponents[0];
      guardOwner.editedComponentsToLeave = editedComponents;
      guardOwner.activeDialog = 'leave';
      guardOwner.pendingRouter = { to, from, next };
    });
  }

  function cleanupRouterGuardIfNeeded() {
    if (registeredComponents.size || !unregisterRouterGuard) return;

    unregisterRouterGuard();
    unregisterRouterGuard = null;
    guardOwner = null;
    confirmedNavigation = false;
  }

  export default {
    data() {
      return {
        pendingRouter: null,
        editedComponentsToLeave: null
      };
    },

    methods: {
      handleClickNext() {
        this.editedComponentsToLeave?.forEach((comp) => comp.clearCache());
        confirmedNavigation = true;
        this.pendingRouter.next();
        this.pendingRouter = null;
        this.activeDialog = false;
        this.editedComponentsToLeave = null;
      },

      handleClickBack() {
        this.pendingRouter.next(false);
        this.pendingRouter = null;
        this.activeDialog = false;
        this.editedComponentsToLeave = null;
      },

      registerRouteLeave() {
        registeredComponents.add(this);
        ensureRouterGuard(this.$router);
      },

      unregisterRouteLeave() {
        registeredComponents.delete(this);

        if (guardOwner === this) {
          guardOwner = null;
        }

        cleanupRouterGuardIfNeeded();
      }
    }
  };
</script>
