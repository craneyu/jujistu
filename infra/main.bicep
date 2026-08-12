targetScope = 'resourceGroup'

@minLength(1)
@maxLength(64)
@description('Name of the environment that can be used as part of naming resource convention')
param environmentName string

@minLength(1)
@description('Primary location for all resources')
param location string

@description('Name of the resource token to make resources unique')
param resourceToken string = toLower(uniqueString(subscription().id, environmentName, location))

@secure()
@minLength(12)
@description('PostgreSQL 管理員密碼。由 azd 從環境變數提供，不寫入版控。')
param postgresAdminPassword string

@secure()
@minLength(32)
@description('JWT 簽章密鑰。後台登入的 token 以此簽發，務必使用高強度隨機值。')
param jwtSecret string

// 標籤
var tags = {
  'azd-env-name': environmentName
}

// 儲存帳戶
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: 'st${resourceToken}'
  location: location
  tags: tags
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    allowBlobPublicAccess: false
    minimumTlsVersion: 'TLS1_2'
  }
}

// Blob 容器
resource blobContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  name: '${storageAccount.name}/default/uploads'
  properties: {
    publicAccess: 'None'
  }
}

// PostgreSQL 伺服器
resource postgresServer 'Microsoft.DBforPostgreSQL/flexibleServers@2023-03-01-preview' = {
  name: 'psql-${resourceToken}'
  location: location
  tags: tags
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    version: '15'
    administratorLogin: 'jujitsuadmin'
    administratorLoginPassword: postgresAdminPassword
    storage: {
      storageSizeGB: 32
    }
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
    }
    highAvailability: {
      mode: 'Disabled'
    }
  }
}

// PostgreSQL 資料庫
resource postgresDatabase 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-03-01-preview' = {
  name: 'jujitsu'
  parent: postgresServer
  properties: {
    charset: 'utf8'
    collation: 'en_US.utf8'
  }
}

// 防火牆規則 - 允許 Azure 服務
resource postgresFirewallRule 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2023-03-01-preview' = {
  name: 'AllowAzureServices'
  parent: postgresServer
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// Log Analytics 工作區
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: 'log-${resourceToken}'
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// Container Apps 環境
resource containerAppsEnvironment 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: 'env-${resourceToken}'
  location: location
  tags: tags
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
  }
}

// 使用者指派的受控識別
resource userIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: 'id-${resourceToken}'
  location: location
  tags: tags
}

// Storage Blob Data Contributor 角色指派
resource storageRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: storageAccount
  name: guid(storageAccount.id, userIdentity.id, 'ba92f5b4-2d11-453d-a403-e96b0029c9fe')
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'ba92f5b4-2d11-453d-a403-e96b0029c9fe')
    principalId: userIdentity.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

// Container App
resource containerApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'app-${resourceToken}'
  location: location
  // azd 透過 azd-service-name 標籤辨識要部署哪個服務的 image 到這個資源
  tags: union(tags, { 'azd-service-name': 'web' })
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${userIdentity.id}': {}
    }
  }
  properties: {
    managedEnvironmentId: containerAppsEnvironment.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: 3000
        allowInsecure: false
        corsPolicy: {
          allowedOrigins: ['*']
          allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
          allowedHeaders: ['*']
        }
      }
      registries: [
        {
          server: containerRegistry.properties.loginServer
          identity: userIdentity.id
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'jujitsu-app'
          // provision 階段 ACR 內還沒有應用程式 image，這裡先用公用的
          // placeholder；azd deploy 會在推送 image 後把它換成實際版本。
          // 直接寫最終 image 會導致 MANIFEST_UNKNOWN 而佈建失敗。
          image: 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            {
              name: 'DATABASE_URL'
              value: 'postgresql://jujitsuadmin:${postgresAdminPassword}@${postgresServer.properties.fullyQualifiedDomainName}:5432/jujitsu?sslmode=require'
            }
            {
              // Prisma 的 schema 宣告了 directUrl，該環境變數必須存在。
              // Flexible Server 前面沒有連線池，因此與 DATABASE_URL 相同即可。
              name: 'DIRECT_URL'
              value: 'postgresql://jujitsuadmin:${postgresAdminPassword}@${postgresServer.properties.fullyQualifiedDomainName}:5432/jujitsu?sslmode=require'
            }
            {
              name: 'AZURE_STORAGE_ACCOUNT_NAME'
              value: storageAccount.name
            }
            {
              name: 'AZURE_STORAGE_CONTAINER_NAME'
              value: 'uploads'
            }
            {
              name: 'AZURE_CLIENT_ID'
              value: userIdentity.properties.clientId
            }
            {
              name: 'JWT_SECRET'
              value: jwtSecret
            }
            {
              name: 'NEXTAUTH_SECRET'
              value: jwtSecret
            }
            {
              // 應用程式對外網址。程式預設會從 x-forwarded-* 標頭自動推導，
              // 這裡明確指定作為保險（例如日後綁定自訂網域時可直接改這裡）。
              // 用環境的 defaultDomain 組出網址，而不是引用 containerApp 自己的
              // ingress.fqdn——後者會造成資源引用自身的循環參照（BCP079）。
              name: 'APP_URL'
              value: 'https://app-${resourceToken}.${containerAppsEnvironment.properties.defaultDomain}'
            }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 3
      }
    }
  }
}

// Container Registry
resource containerRegistry 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: 'cr${resourceToken}'
  location: location
  tags: tags
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: false
  }
}

// ACR Pull 角色指派
resource acrRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: containerRegistry
  name: guid(containerRegistry.id, userIdentity.id, '7f951dda-4ed3-4680-a7ca-43fe172d538d')
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d')
    principalId: userIdentity.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

// 輸出
output AZURE_LOCATION string = location
output AZURE_CONTAINER_REGISTRY_ENDPOINT string = containerRegistry.properties.loginServer
output AZURE_CONTAINER_REGISTRY_NAME string = containerRegistry.name
output AZURE_CONTAINER_APPS_ENVIRONMENT_NAME string = containerAppsEnvironment.name
output AZURE_STORAGE_ACCOUNT_NAME string = storageAccount.name
output APP_URL string = 'https://app-${resourceToken}.${containerAppsEnvironment.properties.defaultDomain}'
// 不輸出連線字串：它含有密碼，會出現在部署記錄與 azd 輸出中。
output POSTGRES_FQDN string = postgresServer.properties.fullyQualifiedDomainName
