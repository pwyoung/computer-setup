# https://registry.terraform.io/providers/maas/maas/latest/docs/resources/tag

resource "maas_tag" "physical" {
  name = "PHYSICAL"
  #machines = [
  #  "oryx"
  #]
}

resource "maas_tag" "kvm" {
  name = "KVM"
  #machines = [
  #  "oryx-1",
  #  "oryx-2"
  #]
}
