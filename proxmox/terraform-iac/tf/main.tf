resource "proxmox_virtual_environment_vm" "ubuntu_vm" {
  name      = "test-ubuntu"
  node_name = "pve"

  # datastore_id = "local-zfs" # invalid here


  initialization {
    user_account {
      # do not use this in production, configure your own ssh key instead!
      username = "root"
      password = "testpw"
    }
  }

  disk {
    datastore_id = "local-lvm" # created this manually (since using ZFS)
    file_id      = proxmox_virtual_environment_file.ubuntu_cloud_image.id
    interface    = "virtio0"
    iothread     = true
    discard      = "on"
    size         = 20
  }
}

resource "proxmox_virtual_environment_file" "ubuntu_cloud_image" {
  content_type = "iso"
  #datastore_id = "local" # Can't use zpool
  #datastore_id = "local-lvm" # Can't upload to LVM
  datastore_id = "local-dir" # Created this on ext4
  node_name    = "pve"

  source_file {
    # you may download this image locally on your workstation and then use the local path instead of the remote URL
    #path      = "https://cloud-images.ubuntu.com/jammy/current/jammy-server-cloudimg-amd64.img"
    #
    # created ext4 storage "local-dir" at /mnt/local-dir
    # Fetch and customize image into ext4 storage "local-dir" at pve host "/mnt/local-dir"
    # cd /mnt/local-dir
    # wget https://cloud-images.ubuntu.com/jammy/current/jammy-server-cloudimg-amd64.img
    # cp ./jammy-server-cloudimg-amd64.img ./jammy-server-cloudimg-amd64.updated.img
    # user/pw = root/testpw
    # virt-customize -a ./jammy-server-cloudimg-amd64.updated.img --root-password password:testpw
    path      = "/imgs/jammy-server-cloudimg-amd64.updated.img"

  }
}
