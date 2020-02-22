
all: deps
	terraform init
	terraform plan -out ./.tfplan
	terraform apply ./.tfplan

deps:
	terraform --version

init: deps
	terraform init

plan: deps
	terraform plan -out ./.tfplan

apply: deps
	terraform apply ./.tfplan
	terraform show

clean: deps
	terraform destroy
	rm ./terraform.tfstate
	rm ./terraform.tfstate.backup

