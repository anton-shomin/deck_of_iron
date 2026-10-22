// AGP 9 bundles KGP 2.2.10; supabase-kt 3.8 is compiled against Kotlin 2.4,
// so the newer KGP is pinned here (see AGP 9.0 release notes, "Upgrade to a higher KGP version").
buildscript {
  dependencies {
    classpath(libs.kotlin.gradle.plugin)
  }
}

plugins {
  alias(libs.plugins.android.application) apply false
  alias(libs.plugins.kotlin.compose) apply false
  alias(libs.plugins.kotlin.serialization) apply false
  alias(libs.plugins.ksp) apply false
}
