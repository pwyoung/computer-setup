# Getting Started with Spark .NET

A Spark extension with support on Spark .Net project to HDInsight Spark cluster. The primary features include Spark .Net project template, Spark .Net project authoring with language service, Spark .Net local run and Spark .Net cluster run.

## **Set up your Spark .NET Environment**

1. Download and install the [**.NET Core SDK**](https://dotnet.microsoft.com/download/dotnet-core/2.1) - installing the SDK will add the .NET toolchain to your path. .NET Core 2.1, 2.2 and 3.0 preview are supported.

2. Install [**Java 1.8**](https://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html) - Select the appropriate version for your operating system e.g., jdk-8u201-windows-x64.exe for Win x64 machine.

    Note: Install using the installer and verify you can run JAVA from your command-line.

3. Install [**Apache Spark 2.3+**](https://spark.apache.org/downloads.html)

    - Download [Apache Spark 2.3+](https://spark.apache.org/downloads.html) and extract it into a local folder (e.g., c:\bin\spark-2.3.2-bin-hadoop2.7\) using [7-zip](https://www.7-zip.org/).
    - Add Apache Spark to your [PATH environment variable](https://www.java.com/en/download/help/path.xml) e.g., c:\bin\spark-2.3.2-bin-hadoop2.7\bin
    - Add a [new environment variable](https://www.java.com/en/download/help/path.xml)  **SPARK\_HOME** e.g., C:\bin\spark-2.3.2-bin-hadoop2.7\

        Note: Verify you can run Spark-shell from your command-line.

4. Update your 7z path, JAVA_HOME, SPARK_HOME, SCALA_HOME and HADOOP_HOME in Preferences->Settings

## **Primary Features**
1. Create Spark .NET project with sample code

2. Author and run Spark .NET project locally

3. Submit Spark .NET to HDInsight Spark Cluster