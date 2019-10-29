1.1.7 2019/09/30
- Support Hive Query Cancel

1.1.6 2019/08/31
- Accessiblity bugs fix and PySpark interactive failure fix

1.1.5 2019/07/17
- Update logo and Third Party Notices

1.1.4 2019/07/15
- Update the extension name from Azure HDInsight Tools to Azure Spark & Hive Tools.
- Add support for SQL Server Big Data Cluster.
- Rename commands prefixes from “HDInsight:” to “Spark:”, “Hive:”, “Spark / Hive:”, or “Azure:”.  
- Remove commands “HDInsight: Login”, “HDInsight: Logout” and “HDInsight: Set Azure Environment”.
- Known issue: For national cloud user, please go to VSCode Settings and search by “Azure: Cloud” to set Azure environment first, then use “Azure: Sign In” command to sign into Azure. 

1.1.3 2019/05/30
- Add Preview Hive table
- Use VSCode Python extension as a dependency for PySpark interactive query
- Update PySpark interactive window
- Bug fixes including job errors related to Spark 2.2 and Spark 2.3

1.1.2 2019/04/26

**Breaking change**: Users with cluster ‘Reader’ only role can no longer submit job to the HDInsight cluster nor view the Hive database. Please request the cluster owner or user access administrator to upgrade your role to HDInsight Cluster Operator in the [Azure Portal](https://portal.azure.com/). Click [here](https://docs.microsoft.com/en-us/azure/hdinsight/hdinsight-migrate-granular-access-cluster-configurations#add-the-hdinsight-cluster-operator-role-assignment-to-a-user) for more information.

- Update to HDInsight new SDKs and APIs for more granular role-based access
- Support ADLS Gen2
- Update to the new WebPreview API
- Switch to the new Azure activity bar for Hdinsight explorer
- Bug fix

1.1.0 2019/01/23
- Replace Pysaprk Interactive environment with python virtualenv and improve get started experience
- Fix hive batch job failed of Generic Livy endpoint
- Fix job failed issue of clusters with Data Lake Storage Gen1
- Update the logo
- Fix password unable to be grabbed when it's Generic Livy
- Output panel can keep hiden after finishing a query
- Fix other bugs

0.0.18 2018/11/08
- Fix cursor jumping to output in vscode 1.28.2

0.0.17 2018/09/05
- HDInsight cluster treeview with sotrage and Hive metadata (only availavle for Azure global environment)
- Azure account authenication support
- Replace the previous setting file with VScode configuration 
- Generic Livy endpoing support
- Downgrade pandas version to 0.22.0 if current installed version is 0.23.0 or higher since pandas 0.23.x doesn't support sparkmagic
- ADD configuration options of disabling local Python environment validation
- ADD shortcut to submit spark job

0.0.16
- Fix access issue of Spark 2.2 

0.0.15 2018/02/12
- Fix linking cluster error 

0.0.14 2018/02/09
- add commands **HDInsight: Link a Cluster** and **HDInsight: Unlink a Cluster** to manage HDInsight clsuters by Ambari credential withhout Azure authenication
- Azure authenication bug fix

0.0.9
- Azure US government, Azure German environment support
- Bug fix

0.0.8
- Fix: format of Hive Data problem
- installing python extension automatically for PySpark interactive

0.0.7
- PySPark Interactive based on Jupyter

0.0.1
- Initial release