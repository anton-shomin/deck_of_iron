import java.util.Properties

plugins {
  alias(libs.plugins.android.application)
  alias(libs.plugins.kotlin.compose)
  alias(libs.plugins.kotlin.serialization)
  alias(libs.plugins.ksp)
}

// Supabase credentials come from android/local.properties (git-ignored) or the environment.
val localProperties = Properties().apply {
  val file = rootProject.file("local.properties")
  if (file.exists()) file.inputStream().use { load(it) }
}

fun secret(name: String): String = localProperties.getProperty(name) ?: System.getenv(name).orEmpty()

android {
  namespace = "com.deckofiron"
  compileSdk = 36

  defaultConfig {
    applicationId = "com.deckofiron.app"
    minSdk = 26
    targetSdk = 36
    versionCode = 1
    versionName = "1.0"

    buildConfigField("String", "SUPABASE_URL", "\"${secret("SUPABASE_URL")}\"")
    buildConfigField("String", "SUPABASE_ANON_KEY", "\"${secret("SUPABASE_ANON_KEY")}\"")
  }

  buildTypes {
    release {
      isMinifyEnabled = false
    }
  }

  compileOptions {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
  }

  buildFeatures {
    compose = true
    buildConfig = true
  }

  androidResources {
    generateLocaleConfig = true
  }
}

ksp {
  arg("room.schemaLocation", "$projectDir/schemas")
}

// exercises.json and presets.json are shared with the web app: ../src/data is the single source of truth.
abstract class SyncWorkoutData : DefaultTask() {
  @get:InputFiles
  @get:PathSensitive(PathSensitivity.NAME_ONLY)
  abstract val sources: ConfigurableFileCollection

  @get:OutputDirectory
  abstract val outputDir: DirectoryProperty

  @get:Inject
  abstract val fileSystem: FileSystemOperations

  @TaskAction
  fun sync() {
    fileSystem.sync {
      from(sources)
      into(outputDir)
    }
  }
}

val syncWorkoutData = tasks.register<SyncWorkoutData>("syncWorkoutData") {
  sources.from(
    layout.projectDirectory.file("../../src/data/exercises.json"),
    layout.projectDirectory.file("../../src/data/presets.json"),
  )
  outputDir.set(layout.buildDirectory.dir("generated/workoutData"))
}

androidComponents {
  onVariants { variant ->
    variant.sources.assets?.addGeneratedSourceDirectory(syncWorkoutData, SyncWorkoutData::outputDir)
  }
}

dependencies {
  implementation(platform(libs.androidx.compose.bom))
  implementation(libs.androidx.compose.ui)
  implementation(libs.androidx.compose.ui.graphics)
  implementation(libs.androidx.compose.ui.tooling.preview)
  implementation(libs.androidx.compose.material3)
  implementation(libs.androidx.compose.material.icons.extended)
  implementation(libs.androidx.activity.compose)
  implementation(libs.androidx.appcompat)
  implementation(libs.androidx.core.ktx)
  implementation(libs.androidx.lifecycle.runtime.compose)
  implementation(libs.androidx.lifecycle.viewmodel.compose)
  implementation(libs.androidx.datastore.preferences)
  implementation(libs.androidx.room.runtime)
  implementation(libs.androidx.room.ktx)
  implementation(libs.kotlinx.serialization.json)
  implementation(libs.kotlinx.coroutines.android)
  implementation(platform(libs.supabase.bom))
  implementation(libs.supabase.auth)
  implementation(libs.supabase.postgrest)
  implementation(libs.ktor.client.okhttp)
  ksp(libs.androidx.room.compiler)

  debugImplementation(libs.androidx.compose.ui.tooling)

  testImplementation(libs.junit)
  testImplementation(libs.kotlinx.coroutines.test)
}
