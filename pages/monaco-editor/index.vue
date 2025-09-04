<template>
  <NuxtLayout>
    <div class="demo-wrap">
      <MonacoEditor
        v-model="sql"
        :custom-keywords="customKeywords"
        :database-options="databaseOptions"
        :trigger-characters="['$']"
        :height="'100%'"
        :width="'100%'"
      />
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
const sql = ref(`SELECT u. FROM appdb.users u\nJOIN appdb.orders o ON u.id = o.user_id\nWHERE `)

const customKeywords = ['$TODAY', '$YESTERDAY']

const databaseOptions = [
  {
    databaseName: 'appdb',
    tableOptions: [
      {
        tableName: 'users',
        tableComment: '用户表',
        fieldOptions: [
          { fieldName: 'id', fieldType: 'int', fieldComment: '主键', databaseName: 'appdb', tableName: 'users' },
          { fieldName: 'name', fieldType: 'varchar', fieldComment: '姓名', databaseName: 'appdb', tableName: 'users' },
          { fieldName: 'email', fieldType: 'varchar', fieldComment: '邮箱', databaseName: 'appdb', tableName: 'users' }
        ]
      },
      {
        tableName: 'orders',
        tableComment: '订单表',
        fieldOptions: [
          { fieldName: 'id', fieldType: 'int', fieldComment: '订单ID', databaseName: 'appdb', tableName: 'orders' },
          {
            fieldName: 'user_id',
            fieldType: 'int',
            fieldComment: '用户ID',
            databaseName: 'appdb',
            tableName: 'orders'
          },
          {
            fieldName: 'amount',
            fieldType: 'decimal',
            fieldComment: '金额',
            databaseName: 'appdb',
            tableName: 'orders'
          }
        ]
      }
    ]
  }
]
</script>

<style scoped>
.demo-wrap {
  height: 80vh;
}
</style>
