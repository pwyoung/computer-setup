# This facilitates development
# This uses terraform-FOSS (not terraform-cloud)

.PHONY=default clean-all clean init plan apply

# Force make to run targets sequentially
.NOTPARALLEL:

default: apply

# Manually remove all files (which are not removed by 'terraform destroy')
clean-all: clean
	rm -rf ./.terraform
	rm -f ./.terraform.lock.hcl
	rm -f ./terraform.tfstate*

clean:
	if [ -e .terraform ]; then terraform destroy -auto-approve; fi
	rm -f .tfplan

init:
	terraform fmt -check || echo 'Run "terraform fmt" to standardize your files so that this will not fail'
	terraform init # "It is safe to run this command multiple times" per https://www.terraform.io/cli/commands/init
	terraform validate

plan: init
	if ! terraform plan -out=.tfplan; then echo "If TF complains about saving the local plan, exit" && exit; fi
	echo "Showing plan"
	terraform show .tfplan

apply: plan
#	terraform apply -auto-approve tfplan
	terraform apply .tfplan
	echo "Showing current state"
	terraform show #  ./terraform.tfstate

